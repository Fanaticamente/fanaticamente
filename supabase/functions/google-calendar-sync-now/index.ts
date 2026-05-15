import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function hasInsufficientScope(details: any) {
  return details?.error?.status === 'PERMISSION_DENIED'
    || details?.error?.reason === 'insufficientPermissions'
    || JSON.stringify(details || {}).includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
}

function nextOccurrence(dayOfWeek: number, hh: number, mm: number): Date {
  const now = new Date()
  const target = new Date(now)
  const diff = (dayOfWeek - now.getDay() + 7) % 7
  target.setDate(now.getDate() + diff)
  target.setHours(hh, mm, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7)
  return target
}

function overlaps(startMs: number, endMs: number, blocks: Array<{ start_time: string; end_time: string }>) {
  return blocks.some((b) => new Date(b.start_time).getTime() < endMs && new Date(b.end_time).getTime() > startMs)
}

async function getBlockedWeeklySlots(admin: any, professionalId: string, blocks: Array<{ start_time: string; end_time: string }>) {
  const { data: avs } = await admin
    .from('professional_weekly_availability')
    .select('day_of_week, time_slots')
    .eq('professional_id', professionalId)
  const blocked: Array<{ day_of_week: number; time: string; date: string }> = []
  for (const av of (avs || [])) {
    for (const time of (av.time_slots || []) as string[]) {
      const [hh, mm] = time.split(':').map(Number)
      const start = nextOccurrence(av.day_of_week, hh, mm)
      const end = new Date(start.getTime() + 50 * 60 * 1000)
      if (overlaps(start.getTime(), end.getTime(), blocks)) {
        blocked.push({ day_of_week: av.day_of_week, time, date: start.toISOString().slice(0, 10) })
      }
    }
  }
  return blocked
}

async function fetchEventBlocks(accessToken: string, calendarId: string, professionalId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
    showDeleted: 'false',
  })
  const evRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const evData = await evRes.json()
  if (!evRes.ok) {
    console.error('events fallback failed', { calendarId, evData })
    return []
  }
  return ((evData.items || []) as Array<any>)
    .filter((ev) => ev.status !== 'cancelled' && ev.transparency !== 'transparent' && (ev.start?.dateTime || ev.start?.date))
    .map((ev) => {
      const isAllDay = !!ev.start.date
      return {
        professional_id: professionalId,
        google_event_id: `${calendarId}|${ev.id}`,
        start_time: isAllDay ? `${ev.start.date}T00:00:00-03:00` : ev.start.dateTime,
        end_time: isAllDay ? `${ev.end.date}T00:00:00-03:00` : ev.end.dateTime,
        summary: ev.summary || null,
        is_all_day: isAllDay,
      }
    })
}

// Public sync: accepts { professional_id } and refreshes google_calendar_blocks
// for that professional. Throttled to once per 60s per professional.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { professional_id, force } = await req.json().catch(() => ({}))
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

    // Throttle: skip if synced less than 60s ago
    if (!force && conn.last_synced_at) {
      const last = new Date(conn.last_synced_at).getTime()
      if (Date.now() - last < 60_000) return json({ ok: true, skipped: 'throttled' })
    }

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

    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    // List ALL calendars the professional has subscribed in Google so busy
    // times across personal + work + dedicated calendars all block app slots.
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const listData = await listRes.json()
    let calIds: string[] = []
    let needsReconnect = false
    if (listRes.ok) {
      const calendars = (listData.items || []) as Array<any>
      // Skip calendars the user explicitly hid or marked as not affecting busy
      calIds = calendars
        .filter((c) => !c.hidden && !c.deleted && c.selected !== false)
        .map((c) => c.id as string)
    } else {
      // Older professional connections may only have event-level permission, not
      // calendar-list/freebusy permission. Do not fail the sync: fall back to the
      // connected calendar (usually primary) so private commitments still block slots.
      console.error('calendarList failed; falling back to connected calendar', listData)
      needsReconnect = hasInsufficientScope(listData)
      calIds = Array.from(new Set([conn.calendar_id || 'primary', 'primary'].filter(Boolean)))
    }

    // Keep the dedicated "Fanaticamente — Sessões" calendar in the busy lookup.
    // App reservations are created as transparent/free events, so freeBusy ignores
    // them, while manual private events created over those holds still block slots.

    // Use freebusy (max 50 calendars per request) to aggregate busy intervals
    const blocks: Array<any> = []
    for (let i = 0; i < calIds.length; i += 50) {
      const chunk = calIds.slice(i, i + 50)
      const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeMin, timeMax,
          timeZone: 'America/Sao_Paulo',
          items: chunk.map((id) => ({ id })),
        }),
      })
      const fbData = await fbRes.json()
      if (fbRes.ok) {
        const cals = fbData.calendars || {}
        for (const [calId, info] of Object.entries<any>(cals)) {
          const busy = (info?.busy || []) as Array<{ start: string; end: string }>
          for (const b of busy) {
            blocks.push({
              professional_id,
              google_event_id: `${calId}|${b.start}|${b.end}`,
              start_time: b.start,
              end_time: b.end,
              summary: null,
              is_all_day: false,
            })
          }
        }
      } else {
        console.error('freeBusy failed; falling back to events.list', fbData)
        if (hasInsufficientScope(fbData)) needsReconnect = true
        for (const calId of chunk) {
          blocks.push(...await fetchEventBlocks(accessToken, calId, professional_id, timeMin, timeMax))
        }
      }
    }

    await admin.from('google_calendar_blocks').delete().eq('professional_id', professional_id)

    if (blocks.length > 0) {
      const { error: insErr } = await admin.from('google_calendar_blocks').insert(blocks)
      if (insErr) console.error('insert blocks error', insErr)
    }

    await admin.from('professional_google_calendar').update({
      last_synced_at: new Date().toISOString(),
    }).eq('professional_id', professional_id)

    return json({ ok: !needsReconnect, needs_reconnect: needsReconnect, count: blocks.length })
  } catch (e) {
    console.error('sync-now error', e)
    return json({ error: String(e) }, 500)
  }
})