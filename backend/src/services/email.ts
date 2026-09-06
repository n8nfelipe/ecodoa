import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: { minVersion: "TLSv1.2" },
  });
}

export async function sendPasswordResetEmail(
  recipient: string,
  resetUrl: string,
  expirationMinutes: number
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "EcoDoa <nao-responda@ecodoa.local>",
    to: recipient,
    subject: "Redefinição de senha — EcoDoa",
    text: [
      "Recebemos uma solicitação para redefinir sua senha no EcoDoa.",
      "",
      `Acesse o link: ${resetUrl}`,
      "",
      `O link expira em ${expirationMinutes} minutos. Se você não fez essa solicitação, ignore este e-mail.`,
    ].join("\n"),
    html: `
      <h1>Redefinição de senha</h1>
      <p>Recebemos uma solicitação para redefinir sua senha no EcoDoa.</p>
      <p><a href="${resetUrl}">Criar uma nova senha</a></p>
      <p>O link expira em ${expirationMinutes} minutos. Se você não fez essa solicitação, ignore este e-mail.</p>
    `,
  });

  return true;
}
