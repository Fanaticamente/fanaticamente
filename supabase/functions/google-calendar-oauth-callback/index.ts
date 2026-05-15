import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, { status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } })
}

function redirectResponse(location: string) {
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: location, 'Cache-Control': 'no-store' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const stateRaw = url.searchParams.get('state')
    const errorParam = url.searchParams.get('error')

    if (errorParam) return htmlResponse(`<h1>Erro</h1><p>${errorParam}</p>`, 400)
    if (!code || !stateRaw) return htmlResponse('<h1>Parâmetros inválidos</h1>', 400)

    let state: { uid: string; r?: string; t: number; p?: string }
    try {
      state = JSON.parse(atob(stateRaw))
    } catch {
      return htmlResponse('<h1>State inválido</h1>', 400)
    }

    // State expires in 10 minutes
    if (!state.uid || Date.now() - state.t > 10 * 60 * 1000) {
      return htmlResponse('<h1>Sessão expirada</h1><p>Tente conectar novamente.</p>', 400)
    }

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID')!
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET')!
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-oauth-callback`

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('token exchange failed', tokenData)
      return htmlResponse(`<h1>Falha na autenticação</h1><pre>${JSON.stringify(tokenData)}</pre>`, 400)
    }

    const { access_token, refresh_token, expires_in } = tokenData as {
      access_token: string; refresh_token?: string; expires_in: number
    }

    // Get user email
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const userInfo = await userInfoRes.json()
    const googleEmail = userInfo.email as string

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find professional record
    const { data: prof } = await admin
      .from('professionals')
      .select('id')
      .eq('user_id', state.uid)
      .maybeSingle()

    if (!prof) return htmlResponse('<h1>Profissional não encontrado</h1>', 404)

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Upsert connection (preserve refresh_token if Google did not return one)
    const { data: existing } = await admin
      .from('professional_google_calendar')
      .select('refresh_token')
      .eq('professional_id', prof.id)
      .maybeSingle()

    const finalRefresh = refresh_token || existing?.refresh_token
    if (!finalRefresh) {
      return htmlResponse('<h1>Sem refresh token</h1><p>Tente desconectar a conta no Google e conectar novamente com prompt=consent.</p>', 400)
    }

    const { error: upsertErr } = await admin
      .from('professional_google_calendar')
      .upsert({
        professional_id: prof.id,
        google_email: googleEmail,
        access_token,
        refresh_token: finalRefresh,
        token_expires_at: expiresAt,
        calendar_id: 'primary',
        is_active: true,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'professional_id' })

    if (upsertErr) {
      console.error('upsert error', upsertErr)
      return htmlResponse(`<h1>Erro ao salvar</h1><pre>${upsertErr.message}</pre>`, 500)
    }

    const returnUrl = state.r || '/'
    const isNative = state.p === 'native'
    // Deep link back to the native app (iOS + Android) so the system browser closes
    // and the app auto-refreshes the connection state. For web, redirect to returnUrl
    // with a query flag so the app can show a toast / refetch.
    const deepLink = `fanaticamente://calendar-connected?email=${encodeURIComponent(googleEmail)}`
    const sep = returnUrl.includes('?') ? '&' : '?'
    const webTarget = `${returnUrl}${sep}gcal=connected&email=${encodeURIComponent(googleEmail)}`
    return redirectResponse(isNative ? deepLink : webTarget)
  } catch (e) {
    console.error('callback error', e)
    return htmlResponse(`<h1>Erro interno</h1><pre>${String(e)}</pre>`, 500)
  }
})