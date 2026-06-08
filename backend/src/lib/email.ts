import { config } from '../config.js';

// Minimal email sender. Uses Resend's HTTP API if RESEND_API_KEY is set;
// otherwise logs the message to the console (dev / not-yet-configured).
// No SDK dependency — just fetch.

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!config.email.resendApiKey) {
    console.log('\n[email:console-fallback] (set RESEND_API_KEY to actually send)');
    console.log(`  to:      ${to}`);
    console.log(`  subject: ${subject}`);
    console.log(`  text:    ${text}\n`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.email.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.email.from, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[email] Resend error', res.status, body);
    throw new Error('Failed to send email');
  }
}

// ---- Templates (cute, on-brand, minimal HTML) ----------------------------
const wrap = (inner: string) => `
  <div style="font-family: Arial, sans-serif; background:#F4EDE0; padding:32px;">
    <div style="max-width:480px;margin:0 auto;background:#FDFAF5;border-radius:18px;padding:28px;border:1px solid #DDD4C4;">
      <div style="font-size:28px;font-weight:700;color:#163324;margin-bottom:16px;">buddi 🌱</div>
      ${inner}
      <p style="color:#8A7E6E;font-size:12px;margin-top:24px;">If you didn't request this, you can ignore this email.</p>
    </div>
  </div>`;

export function verifyEmailTemplate(link: string) {
  return {
    subject: 'Verify your Buddi email',
    text: `Welcome to Buddi! Verify your email: ${link}`,
    html: wrap(
      `<p style="color:#0C1A0E;font-size:16px;">Welcome to Buddi! Tap below to verify your email and keep your garden growing.</p>
       <a href="${link}" style="display:inline-block;margin-top:12px;background:#C87828;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">Verify email</a>`
    ),
  };
}

export function resetPasswordTemplate(link: string) {
  return {
    subject: 'Reset your Buddi password',
    text: `Reset your Buddi password: ${link}`,
    html: wrap(
      `<p style="color:#0C1A0E;font-size:16px;">Forgot your password? No worries. Tap below to set a new one. This link expires in 1 hour.</p>
       <a href="${link}" style="display:inline-block;margin-top:12px;background:#163324;color:#F4EDE0;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">Reset password</a>`
    ),
  };
}
