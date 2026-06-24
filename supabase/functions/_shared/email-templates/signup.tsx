/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail na {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo à torcida!</Heading>
        <Text style={text}>
          Que bom ter você na{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Sua jornada de saúde mental no esporte começa agora.
        </Text>
        <Text style={text}>
          Para ativar sua conta (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ), confirme seu e-mail clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar e-mail
        </Button>
        <Text style={footer}>
          Se você não criou uma conta na {siteName}, pode ignorar este e-mail com tranquilidade.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Work Sans", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#141414',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#3f3f46',
  lineHeight: '1.6',
  margin: '0 0 22px',
}
const link = { color: '#141414', textDecoration: 'underline' }
const button = {
  backgroundColor: '#ffcc00',
  color: '#141414',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#71717a', margin: '32px 0 0', lineHeight: '1.5' }
