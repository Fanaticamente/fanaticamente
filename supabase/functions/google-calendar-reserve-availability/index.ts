import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`refresh failed: ${JSON.stringify(data)}`)
  return { access_token: data.access_token as string, expires_in: data.expires_in as number }
}

const RECURRENCE_WEEKS = 12
const SESSION_MIN = 50
const RES_TAG_KEY = 'app'
const RES_TAG_VAL = 'fanaticamente_reservation'
const RES_SUMMARY = 'Reservado — Fanaticamente'
const SP_OFFSET_HOURS = 3

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Google Calendar limits ~600 queries/min/user. We rate-limit our writes to
// stay well under that and retry on transient quota errors.
async function gfetch(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  const res = await fetch(url, init)
  if (res.status === 403 || res.status === 429) {
    const text = await res.clone().text().catch(() => '')
    if (/rateLimitExceeded|userRateLimitExceeded|Quota exceeded/i.test(text) && attempt < 5) {
      await sleep(500 * Math.pow(2, attempt))
      return gfetch(url, init, attempt + 1)
    }
  }
  return res
}

function hasInsufficientScope(details: any) {
  return details?.error?.status === 'PERMISSION_DENIED'
    || details?.error?.reason === 'insufficientPermissions'
    || JSON.stringify(details || {}).includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
}

function shouldIgnoreCalendarBlock(ev: any) {
  const summary = String(ev?.summary || '').trim().toLowerCase()
  const eventType = String(ev?.eventType || '').toLowerCase()
  return summary === 'reservado — fanaticamente'
    || summary === 'horários para agendamento'
    || eventType === 'appointmentschedule'
}

async function fetchBusyEventBlocks(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
    showDeleted: 'false',
  })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('events validation failed', { calendarId, data })
    return null
  }
  return ((data.items || []) as Array<any>)
    .filter((ev) => ev.status !== 'cancelled' && ev.transparency !== 'transparent' && !shouldIgnoreCalendarBlock(ev) && (ev.start?.dateTime || ev.start?.date))
    .map((ev) => ({
      start: ev.start.dateTime || `${ev.start.date}T00:00:00-03:00`,
      end: ev.end.dateTime || `${ev.end.date}T00:00:00-03:00`,
    }))
}

async function fetchBusyBlocks(accessToken: string, calendarIds: string[], timeMin: string, timeMax: string) {
  const blocks: Array<{ start: string; end: string }> = []
  let needsReconnect = false
  for (let i = 0; i < calendarIds.length; i += 50) {
    const chunk = calendarIds.slice(i, i + 50)
    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: 'America/Sao_Paulo',
        items: chunk.map((id) => ({ id })),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('freeBusy validation failed', data)
      if (hasInsufficientScope(data)) needsReconnect = true
      continue
    }
    for (const id of chunk) {
      // Prefer event details over freeBusy because Google Appointment Schedule
      // blocks are returned as busy but are not real commitments.
      const detailedBlocks = await fetchBusyEventBlocks(accessToken, id, timeMin, timeMax)
      if (detailedBlocks) {
        blocks.push(...detailedBlocks)
        continue
      }
      const info = data.calendars?.[id]
      blocks.push(...((info?.busy || []) as Array<{ start: string; end: string }>))
    }
  }
  return { blocks, needsReconnect }
}

function nextOccurrence(dayOfWeek: number, hh: number, mm: number): Date {
  const now = new Date()
  const spNow = new Date(now.getTime() - SP_OFFSET_HOURS * 60 * 60 * 1000)
  const diff = (dayOfWeek - spNow.getUTCDay() + 7) % 7
  const target = new Date(Date.UTC(
    spNow.getUTCFullYear(),
    spNow.getUTCMonth(),
    spNow.getUTCDate() + diff,
    hh + SP_OFFSET_HOURS,
    mm,
    0,
    0,
  ))
  if (target.getTime() <= now.getTime()) target.setUTCDate(target.getUTCDate() + 7)
  return target
}

function localISO(date: Date, hh: number, mm: number): string {
  // Returns YYYY-MM-DDTHH:MM:00 (no timezone — sent with timeZone field)
  const spDate = new Date(date.getTime() - SP_OFFSET_HOURS * 60 * 60 * 1000)
  const y = spDate.getUTCFullYear()
  const m = String(spDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(spDate.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`
}

function overlaps(startMs: number, endMs: number, blocks: Array<{ start: string; end: string }>) {
  return blocks.some((b) => new Date(b.start).getTime() < endMs && new Date(b.end).getTime() > startMs)
}

function saoPauloDateString(date: Date) {
  return new Date(date.getTime() - SP_OFFSET_HOURS * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function saoPauloTimeString(date: Date) {
  const spDate = new Date(date.getTime() - SP_OFFSET_HOURS * 60 * 60 * 1000)
  return `${String(spDate.getUTCHours()).padStart(2, '0')}:${String(spDate.getUTCMinutes()).padStart(2, '0')}`
}

function saoPauloDayOfWeek(date: Date) {
  return new Date(date.getTime() - SP_OFFSET_HOURS * 60 * 60 * 1000).getUTCDay()
}

function reservationKey(day: string | number, time: string, date: string) {
  return `${day}|${time}|${date}`
}

// Google event IDs must be base32hex (chars 0-9a-v), length 5-1024.
// Build a deterministic id from the professional + slot key so duplicate
// POSTs return 409 instead of creating a second event.
async function deterministicEventId(professionalId: string, key: string): Promise<string> {
  const data = new TextEncoder().encode(`${professionalId}|${key}`)
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
  // base32hex encode
  const alphabet = '0123456789abcdefghijklmnopqrstuv'
  let bits = 0, value = 0, out = ''
  for (const b of hash) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 0x1f]
  return `fan${out}`.slice(0, 60)
}

async function listReservationEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const encCid = encodeURIComponent(calendarId)
  const seen = new Set<string>()
  const events: Array<any> = []
  const queries = [
    new URLSearchParams({ privateExtendedProperty: `${RES_TAG_KEY}=${RES_TAG_VAL}`, maxResults: '2500', singleEvents: 'true', showDeleted: 'false', timeMin, timeMax }),
    new URLSearchParams({ q: RES_SUMMARY, maxResults: '2500', singleEvents: 'true', showDeleted: 'false', timeMin, timeMax }),
  ]
  for (const baseParams of queries) {
    let pageToken: string | undefined
    do {
      const params = new URLSearchParams(baseParams)
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encCid}/events?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(`list reservations failed: ${JSON.stringify(data)}`)
      for (const ev of ((data.items || []) as Array<any>)) {
        if (!ev.id || seen.has(ev.id)) continue
        const tagged = ev.extendedProperties?.private?.[RES_TAG_KEY] === RES_TAG_VAL
        const titled = (ev.summary || '').trim() === RES_SUMMARY
        if (!tagged && !titled) continue
        seen.add(ev.id)
        events.push(ev)
      }
      pageToken = data.nextPageToken
    } while (pageToken)
  }
  return events
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { professional_id, wait, day_of_week, time_slots } = await req.json().catch(() => ({}))
    if (!professional_id) return json({ error: 'professional_id required' }, 400)
    const scopedDay = Number.isInteger(day_of_week) ? Number(day_of_week) : null
    const scopedTimes = scopedDay !== null && Array.isArray(time_slots)
      ? (time_slots as unknown[]).filter((t): t is string => typeof t === 'string')
      : null

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: conn } = await admin
      .from('professional_google_calendar')
      .select('*')
      .eq('professional_id', professional_id)
      .maybeSingle()
    if (!conn) return json({ ok: false, skipped: 'not_connected' })

    let accessToken = conn.access_token as string
    const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0
    if (!accessToken || Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshAccessToken(conn.refresh_token as string)
      accessToken = refreshed.access_token
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      await admin.from('professional_google_calendar').update({
        access_token: accessToken,
        token_expires_at: newExpiry,
      }).eq('professional_id', professional_id)
    }

    const calendarId = conn.calendar_id || 'primary'
    const calId = encodeURIComponent(calendarId)

    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + RECURRENCE_WEEKS * 7 * 24 * 60 * 60 * 1000).toISOString()
    const listCalendarsRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const listCalendarsData = await listCalendarsRes.json()
    const listNeedsReconnect = !listCalendarsRes.ok && hasInsufficientScope(listCalendarsData)
    const busyCalendarIds = listCalendarsRes.ok
      ? ((listCalendarsData.items || []) as Array<any>)
          .filter((c) => !c.hidden && !c.deleted && c.selected !== false)
          .map((c) => c.id as string)
      : [calendarId, 'primary']
    const { blocks: busyBlocks, needsReconnect: freeBusyNeedsReconnect } = scopedTimes
      ? { blocks: [], needsReconnect: false }
      : await fetchBusyBlocks(accessToken, Array.from(new Set(busyCalendarIds)), timeMin, timeMax)
    if (listNeedsReconnect || freeBusyNeedsReconnect) {
      return json({ ok: false, needs_reconnect: true, created: 0, skipped: 'calendar_validation_incomplete' }, 409)
    }

    // Heavy work (delete + recreate) runs in background so the request returns
    // before Google rate-limit retries push us past the gateway timeout. The
    // frontend re-fetches the busy blocks shortly after.
    const heavyWork = (async () => {
    const existingReservations = await listReservationEvents(accessToken, calendarId, timeMin, timeMax)
    const existingByKey = new Map<string, any>()
    for (const ev of existingReservations) {
      const startValue = ev.start?.dateTime || ev.start?.date
      if (!startValue) continue
      const startDate = new Date(startValue)
      const day = ev.extendedProperties?.private?.day || String(saoPauloDayOfWeek(startDate))
      if (scopedDay !== null && Number(day) !== scopedDay) continue
      const time = ev.extendedProperties?.private?.time || saoPauloTimeString(startDate)
      existingByKey.set(reservationKey(day, time, saoPauloDateString(startDate)), ev)
    }
    const desiredKeys = new Set<string>()
    let deleted = 0

    // 2) Load weekly availability and create real dated hold events per slot.
    // Each occurrence is checked against Google busy blocks before creation, so
    // a private appointment on 18/05 14:00 blocks only that exact date.
    const { data: avsFromDb } = scopedTimes
      ? { data: [{ day_of_week: scopedDay, time_slots: scopedTimes }] }
      : await admin
          .from('professional_weekly_availability')
          .select('day_of_week, time_slots')
          .eq('professional_id', professional_id)

    let created = 0
    let skipped_conflicts = 0
    for (const av of (avsFromDb || [])) {
      for (const time of (av.time_slots || []) as string[]) {
        const [hh, mm] = time.split(':').map(Number)
        const firstStart = nextOccurrence(av.day_of_week, hh, mm)
        for (let week = 0; week < RECURRENCE_WEEKS; week++) {
          const start = new Date(firstStart)
          start.setDate(firstStart.getDate() + week * 7)
          const end = new Date(start)
          end.setMinutes(end.getMinutes() + SESSION_MIN)
          if (overlaps(start.getTime(), end.getTime(), busyBlocks)) {
            skipped_conflicts++
            continue
          }
          const key = reservationKey(av.day_of_week, time, saoPauloDateString(start))
          desiredKeys.add(key)
          if (existingByKey.has(key)) continue
          const startISO = localISO(start, hh, mm)
          const endMinutes = hh * 60 + mm + SESSION_MIN
          const endISO = localISO(end, Math.floor(endMinutes / 60) % 24, endMinutes % 60)
          const eventBody = {
            id: await deterministicEventId(professional_id, key),
            summary: 'Reservado — Fanaticamente',
            description: 'Horário disponibilizado para sessões pelo aplicativo Fanaticamente. Para bloquear este horário nesta data, crie um compromisso pessoal sobreposto neste horário em qualquer agenda.',
            start: { dateTime: startISO, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: endISO, timeZone: 'America/Sao_Paulo' },
            transparency: 'transparent',
            extendedProperties: { private: { [RES_TAG_KEY]: RES_TAG_VAL, day: String(av.day_of_week), time } },
            reminders: { useDefault: false },
          }
          const evRes = await gfetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventBody),
            },
          )
          if (evRes.ok) created++
          else if (evRes.status === 409) {
            // Already exists with the same deterministic id — treat as success.
          }
          else {
            const err = await evRes.json().catch(() => ({}))
            console.error('create reservation failed', err)
          }
        }
      }
    }

    for (const [key, ev] of existingByKey) {
      if (desiredKeys.has(key) || !ev.id) continue
      const delRes = await gfetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${encodeURIComponent(ev.id)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (delRes.ok || delRes.status === 410) deleted++
      else console.error('delete stale reservation failed', { id: ev.id, status: delRes.status })
    }

      console.log('reserve-availability done', { deleted, created, skipped_conflicts })
      return { deleted, created, skipped_conflicts }
    })()
    if (wait) {
      const result = await heavyWork
      return json({ ok: true, ...result })
    }
    // @ts-ignore EdgeRuntime is available in Supabase functions runtime
    if (typeof EdgeRuntime !== 'undefined' && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(heavyWork.catch((e) => console.error('heavy work failed', e)))
    } else {
      heavyWork.catch((e) => console.error('heavy work failed', e))
    }
    return json({ ok: true, started: true })
  } catch (e) {
    console.error('reserve-availability error', e)
    return json({ error: String(e) }, 500)
  }
})