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
    const calId = encodeURIComponent(conn.calendar_id || 'primary')
    const params = new URLSearchParams({
      timeMin, timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
      showDeleted: 'false',
    })

    const evRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const evData = await evRes.json()
    if (!evRes.ok) {
      console.error('events fetch failed', evData)
      return json({ error: 'google_api', details: evData }, 500)
    }

    const items = (evData.items || []) as Array<any>
    await admin.from('google_calendar_blocks').delete().eq('professional_id', professional_id)

    const blocks = items
      .filter((ev) => ev.status !== 'cancelled' && (ev.start?.dateTime || ev.start?.date))
      .map((ev) => {
        const isAllDay = !!ev.start.date
        const start = isAllDay ? `${ev.start.date}T00:00:00Z` : ev.start.dateTime
        const end = isAllDay ? `${ev.end.date}T00:00:00Z` : ev.end.dateTime
        return {
          professional_id,
          google_event_id: ev.id,
          start_time: start,
          end_time: end,
          summary: ev.summary || null,
          is_all_day: isAllDay,
        }
      })

    if (blocks.length > 0) {
      const { error: insErr } = await admin.from('google_calendar_blocks').insert(blocks)
      if (insErr) console.error('insert blocks error', insErr)
    }

    await admin.from('professional_google_calendar').update({
      last_synced_at: new Date().toISOString(),
    }).eq('professional_id', professional_id)

    return json({ ok: true, count: blocks.length })
  } catch (e) {
    console.error('sync-now error', e)
    return json({ error: String(e) }, 500)
  }
})