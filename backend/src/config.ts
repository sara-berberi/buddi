import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required env var: ${name}. Set it in backend/.env (see .env.example).`
    );
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    accessSecret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessTtl: '15m',
    refreshTtlDays: 30,
  },
  email: {
    // When RESEND_API_KEY is unset, the email sender logs links to the console
    // instead of sending — so verify/reset work in dev/TestFlight immediately.
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'Buddi <onboarding@resend.dev>',
  },
  // Used to build links inside emails (web reset page / deep links).
  appUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:8081',
} as const;
