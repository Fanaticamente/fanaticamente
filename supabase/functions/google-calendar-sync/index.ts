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

function shouldIgnoreCalendarBlock(ev: any) {
  const summary = String(ev?.summary || '').trim().toLowerCase()
  const eventType = String(ev?.eventType || '').toLowerCase()
  return summary === 'reservado — fanaticamente'
    || summary === 'horários para agendamento'
    || eventType === 'appointmentschedule'
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
    console.error('events fetch failed', { calendarId, evData })
    return []
  }
  return ((evData.items || []) as Array<any>)
    .filter((ev) => ev.status !== 'cancelled' && ev.transparency !== 'transparent' && !shouldIgnoreCalendarBlock(ev) && (ev.start?.dateTime || ev.start?.date))
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token)
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claims.claims.sub as string

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: prof } = await admin.from('professionals').select('id').eq('user_id', userId).maybeSingle()
    if (!prof) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: conn } = await admin
      .from('professional_google_calendar')
      .select('*')
      .eq('professional_id', prof.id)
      .maybeSingle()

    if (!conn) return new Response(JSON.stringify({ error: 'Not connected' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Refresh token if expired or close to expiring (60s buffer)
    let accessToken = conn.access_token as string
    const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0
    if (!accessToken || Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshAccessToken(conn.refresh_token as string)
      accessToken = refreshed.access_token
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      await admin.from('professional_google_calendar').update({
        access_token: accessToken,
        token_expires_at: newExpiry,
      }).eq('professional_id', prof.id)
    }

    // Fetch events from now to +60 days
    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    // Replace blocks for this professional in the window
    await admin.from('google_calendar_blocks').delete().eq('professional_id', prof.id)

    const blocks = await fetchEventBlocks(accessToken, conn.calendar_id || 'primary', prof.id, timeMin, timeMax)

    if (blocks.length > 0) {
      const { error: insErr } = await admin.from('google_calendar_blocks').insert(blocks)
      if (insErr) console.error('insert blocks error', insErr)
    }

    await admin.from('professional_google_calendar').update({
      last_synced_at: new Date().toISOString(),
    }).eq('professional_id', prof.id)

    return new Response(JSON.stringify({ ok: true, count: blocks.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('sync error', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})