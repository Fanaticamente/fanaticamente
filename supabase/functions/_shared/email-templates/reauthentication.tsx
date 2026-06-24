/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirmar identidade</Heading>
        <Text style={text}>Use o código abaixo para confirmar que é você:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código expira em alguns minutos. Se você não solicitou esta verificação, pode ignorar este e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  letterSpacing: '6px',
  fontWeight: 'bold' as const,
  color: '#141414',
  backgroundColor: '#fff8d1',
  borderRadius: '12px',
  padding: '16px 24px',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#71717a', margin: '32px 0 0', lineHeight: '1.5' }
