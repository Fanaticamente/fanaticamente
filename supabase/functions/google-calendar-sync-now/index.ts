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

    // List ALL calendars the professional has subscribed in Google so busy
    // times across personal + work + dedicated calendars all block app slots.
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const listData = await listRes.json()
    if (!listRes.ok) {
      console.error('calendarList failed', listData)
      return json({ error: 'google_api', details: listData }, 500)
    }
    const calendars = (listData.items || []) as Array<any>
    // Skip calendars the user explicitly hid or marked as not affecting busy
    const calIds: string[] = calendars
      .filter((c) => !c.hidden && !c.deleted && c.selected !== false)
      .map((c) => c.id as string)

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
      if (!fbRes.ok) {
        console.error('freeBusy failed', fbData)
        continue
      }
      const cals = fbData.calendars || {}
      for (const [calId, info] of Object.entries<any>(cals)) {
        const busy = (info?.busy || []) as Array<{ start: string; end: string }>
        for (const b of busy) {
          blocks.push({
            professional_id,
            google_event_id: `${calId}|${b.start}`,
            start_time: b.start,
            end_time: b.end,
            summary: null,
            is_all_day: false,
          })
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

    return json({ ok: true, count: blocks.length })
  } catch (e) {
    console.error('sync-now error', e)
    return json({ error: String(e) }, 500)
  }
})