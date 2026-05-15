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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token)
    if (cErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)
    const userId = claims.claims.sub as string

    const { appointment_id } = await req.json().catch(() => ({}))
    if (!appointment_id) return json({ error: 'appointment_id required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: apt } = await admin
      .from('appointments')
      .select('id, professional_id, user_id, scheduled_date, scheduled_time, consultation_link, google_event_id, notes')
      .eq('id', appointment_id)
      .maybeSingle()
    if (!apt) return json({ error: 'appointment not found' }, 404)

    const { data: prof } = await admin
      .from('professionals')
      .select('id, user_id')
      .eq('id', apt.professional_id)
      .maybeSingle()
    if (!prof) return json({ error: 'professional not found' }, 404)
    if (prof.user_id !== userId) return json({ error: 'forbidden' }, 403)

    const { data: conn } = await admin
      .from('professional_google_calendar')
      .select('*')
      .eq('professional_id', prof.id)
      .maybeSingle()
    if (!conn) return json({ ok: false, skipped: 'not_connected' })

    // Refresh token if needed
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

    // Patient info
    const { data: patient } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', apt.user_id)
      .maybeSingle()
    const patientName = patient?.full_name || 'Paciente'

    // Build datetime in America/Sao_Paulo (GMT-03)
    const date = apt.scheduled_date as string // YYYY-MM-DD
    const time = (apt.scheduled_time as string).slice(0, 5) // HH:MM
    const startLocal = `${date}T${time}:00`
    // 50 min session
    const [h, m] = time.split(':').map(Number)
    const endMinTotal = h * 60 + m + 50
    const eh = String(Math.floor(endMinTotal / 60) % 24).padStart(2, '0')
    const em = String(endMinTotal % 60).padStart(2, '0')
    const endLocal = `${date}T${eh}:${em}:00`

    const calId = encodeURIComponent(conn.calendar_id || 'primary')
    const eventBody: Record<string, unknown> = {
      summary: `Sessão Fanaticamente — ${patientName}`,
      description: [
        `Paciente: ${patientName}`,
        apt.consultation_link ? `Link: ${apt.consultation_link}` : null,
        apt.notes ? `Notas: ${apt.notes}` : null,
        `ID: ${apt.id}`,
      ].filter(Boolean).join('\n'),
      start: { dateTime: startLocal, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endLocal, timeZone: 'America/Sao_Paulo' },
      reminders: { useDefault: true },
    }

    let url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`
    let method: 'POST' | 'PATCH' = 'POST'
    if (apt.google_event_id) {
      url = `${url}/${encodeURIComponent(apt.google_event_id as string)}`
      method = 'PATCH'
    }

    const evRes = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody),
    })
    const evData = await evRes.json()
    if (!evRes.ok) {
      console.error('event create failed', evData)
      return json({ error: 'google_api', details: evData }, 500)
    }

    await admin.from('appointments').update({ google_event_id: evData.id }).eq('id', apt.id)

    return json({ ok: true, event_id: evData.id, htmlLink: evData.htmlLink })
  } catch (e) {
    console.error('create-event error', e)
    return json({ error: String(e) }, 500)
  }
})