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

const RECURRENCE_WEEKS = 26
const SESSION_MIN = 50
const RES_TAG_KEY = 'app'
const RES_TAG_VAL = 'fanaticamente_reservation'

async function fetchBusyBlocks(accessToken: string, calendarIds: string[], timeMin: string, timeMax: string) {
  const blocks: Array<{ start: string; end: string }> = []
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
      continue
    }
    for (const info of Object.values<any>(data.calendars || {})) {
      blocks.push(...((info?.busy || []) as Array<{ start: string; end: string }>))
    }
  }
  return blocks
}

function nextOccurrence(dayOfWeek: number, hh: number, mm: number): Date {
  // Compute the next date (>= today) where local weekday == dayOfWeek
  const now = new Date()
  const nowDow = now.getDay()
  let diff = (dayOfWeek - nowDow + 7) % 7
  const candidate = new Date(now)
  candidate.setDate(now.getDate() + diff)
  candidate.setHours(hh, mm, 0, 0)
  if (candidate.getTime() <= now.getTime() && diff === 0) {
    candidate.setDate(candidate.getDate() + 7)
  }
  return candidate
}

function localISO(date: Date, hh: number, mm: number): string {
  // Returns YYYY-MM-DDTHH:MM:00 (no timezone — sent with timeZone field)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`
}

function overlaps(startMs: number, endMs: number, blocks: Array<{ start: string; end: string }>) {
  return blocks.some((b) => new Date(b.start).getTime() < endMs && new Date(b.end).getTime() > startMs)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { professional_id } = await req.json().catch(() => ({}))
    if (!professional_id) return json({ error: 'professional_id required' }, 400)

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
    const busyCalendarIds = listCalendarsRes.ok
      ? ((listCalendarsData.items || []) as Array<any>)
          .filter((c) => !c.hidden && !c.deleted && c.selected !== false)
          .map((c) => c.id as string)
      : [calendarId, 'primary']
    const busyBlocks = await fetchBusyBlocks(accessToken, Array.from(new Set(busyCalendarIds)), timeMin, timeMax)

    // 1) List & delete previous reservation events on the dedicated calendar
    let pageToken: string | undefined
    do {
      const params = new URLSearchParams({
        privateExtendedProperty: `${RES_TAG_KEY}=${RES_TAG_VAL}`,
        maxResults: '2500',
        showDeleted: 'false',
      })
      if (pageToken) params.set('pageToken', pageToken)
      const listRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const listData = await listRes.json()
      if (!listRes.ok) {
        console.error('list reservations failed', listData)
        break
      }
      for (const ev of ((listData.items || []) as Array<any>)) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${encodeURIComponent(ev.id)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
        )
      }
      pageToken = listData.nextPageToken
    } while (pageToken)

    // 2) Load weekly availability and create real dated hold events per slot.
    // Each occurrence is checked against Google busy blocks before creation, so
    // a private appointment on 18/05 14:00 blocks only that exact date.
    const { data: avs } = await admin
      .from('professional_weekly_availability')
      .select('day_of_week, time_slots')
      .eq('professional_id', professional_id)

    let created = 0
    let skipped_conflicts = 0
    for (const av of (avs || [])) {
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
          const startISO = localISO(start, hh, mm)
          const endISO = localISO(end, end.getHours(), end.getMinutes())
          const eventBody = {
            summary: 'Reservado — Fanaticamente',
            description: 'Horário disponibilizado para sessões pelo aplicativo Fanaticamente. Para bloquear este horário nesta data, crie um compromisso pessoal sobreposto neste horário em qualquer agenda.',
            start: { dateTime: startISO, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: endISO, timeZone: 'America/Sao_Paulo' },
            transparency: 'transparent',
            extendedProperties: { private: { [RES_TAG_KEY]: RES_TAG_VAL, day: String(av.day_of_week), time } },
            reminders: { useDefault: false },
          }
          const evRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventBody),
            },
          )
          if (evRes.ok) created++
          else {
            const err = await evRes.json().catch(() => ({}))
            console.error('create reservation failed', err)
          }
        }
      }
    }

    return json({ ok: true, created, skipped_conflicts })
  } catch (e) {
    console.error('reserve-availability error', e)
    return json({ error: String(e) }, 500)
  }
})