import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')

const FROM = process.env.EMAIL_FROM ?? 'noreply@orgbridge.net'

function hasResend() {
  const key = process.env.RESEND_API_KEY
  return key && key.startsWith('re_') && key.length > 10
}

function devLog(fn: string, to: string, extra?: Record<string, string>) {
  console.log(`[email:dev] ${fn} → ${to}`, extra ?? '')
}

export async function sendWelcomeEmail(to: string, name: string) {
  if (!hasResend()) { devLog('sendWelcomeEmail', to, { name }); return }
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Bem-vindo ao OrgBridge!',
    html: `
      <h2>Olá, ${name}! Bem-vindo ao OrgBridge 🎉</h2>
      <p>Sua conta foi verificada e você já pode acessar a plataforma.</p>
      <p>O OrgBridge é a rede social corporativa privada da sua empresa — um espaço para comunicação, reconhecimento e colaboração com IA integrada.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Acessar OrgBridge
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">
        Qualquer dúvida, responda este e-mail.
      </p>
    `,
  })
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`
  if (!hasResend()) { devLog('sendVerificationEmail', to, { url }); return }
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Confirme seu e-mail — OrgBridge',
    html: `
      <h2>Olá, ${name}!</h2>
      <p>Confirme seu endereço de e-mail clicando no botão abaixo:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Confirmar e-mail
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">
        O link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.
      </p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
  if (!hasResend()) { devLog('sendPasswordResetEmail', to, { url }); return }
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Redefinir senha — OrgBridge',
    html: `
      <h2>Olá, ${name}!</h2>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Redefinir senha
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">
        O link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.
      </p>
    `,
  })
}

export async function sendNetworkInviteEmail(
  to: string,
  networkName: string,
  inviterName: string,
  token: string,
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`
  if (!hasResend()) { devLog('sendNetworkInviteEmail', to, { url, networkName }); return }
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Você foi convidado para ${networkName} — OrgBridge`,
    html: `
      <h2>${inviterName} convidou você para ${networkName}</h2>
      <p>Aceite o convite e comece a colaborar com sua equipe no OrgBridge.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Aceitar convite
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">
        O convite expira em 7 dias.
      </p>
    `,
  })
}

export async function sendPaymentFailedEmail(to: string, networkName: string) {
  if (!hasResend()) { devLog('sendPaymentFailedEmail', to, { networkName }); return }
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Pagamento não processado — ${networkName}`,
    html: `
      <h2>Atenção: pagamento não processado</h2>
      <p>Não conseguimos processar o pagamento da assinatura <strong>${networkName}</strong>.</p>
      <p>Atualize seu método de pagamento para manter o acesso à plataforma.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Atualizar pagamento
      </a>
    `,
  })
}
