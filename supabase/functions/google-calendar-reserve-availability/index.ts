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

// Day-of-week map (DB stores 0=Sunday..6=Saturday)
const DOW_RRULE = ['SU','MO','TU','WE','TH','FR','SA']

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

    const calId = encodeURIComponent(conn.calendar_id || 'primary')

    // 1) List & delete previous reservation events on the dedicated calendar
    const params = new URLSearchParams({
      privateExtendedProperty: `${RES_TAG_KEY}=${RES_TAG_VAL}`,
      maxResults: '2500',
      showDeleted: 'false',
    })
    const listRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const listData = await listRes.json()
    if (listRes.ok) {
      const items = (listData.items || []) as Array<any>
      for (const ev of items) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${encodeURIComponent(ev.id)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
        )
      }
    } else {
      console.error('list reservations failed', listData)
    }

    // 2) Load weekly availability and create one recurring event per slot
    const { data: avs } = await admin
      .from('professional_weekly_availability')
      .select('day_of_week, time_slots')
      .eq('professional_id', professional_id)

    let created = 0
    for (const av of (avs || [])) {
      for (const time of (av.time_slots || []) as string[]) {
        const [hh, mm] = time.split(':').map(Number)
        const start = nextOccurrence(av.day_of_week, hh, mm)
        const endMin = hh * 60 + mm + SESSION_MIN
        const eh = Math.floor(endMin / 60) % 24
        const em = endMin % 60
        const startISO = localISO(start, hh, mm)
        const endISO = localISO(start, eh, em)
        const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${DOW_RRULE[av.day_of_week]};COUNT=${RECURRENCE_WEEKS}`
        const eventBody = {
          summary: 'Reservado — Fanaticamente',
          description: 'Horário disponibilizado para sessões pelo aplicativo Fanaticamente. Para bloquear este horário em uma semana específica, crie um compromisso pessoal sobreposto neste horário em qualquer agenda.',
          start: { dateTime: startISO, timeZone: 'America/Sao_Paulo' },
          end: { dateTime: endISO, timeZone: 'America/Sao_Paulo' },
          recurrence: [rrule],
          transparency: 'transparent',
          extendedProperties: { private: { [RES_TAG_KEY]: RES_TAG_VAL } },
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
        if (evRes.ok) {
          created++
        } else {
          const err = await evRes.json().catch(() => ({}))
          console.error('create reservation failed', err)
        }
      }
    }

    return json({ ok: true, created })
  } catch (e) {
    console.error('reserve-availability error', e)
    return json({ error: String(e) }, 500)
  }
})