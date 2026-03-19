import { randomInt } from "crypto";
import nodemailer from "nodemailer";

export function generateOTP(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(randomInt(min, max + 1));
} 

export function generateEmailLayout(params: { title: string; bodyContent: string }): string {
  const { title, bodyContent } = params;
  return `
  <div style="font-family: Arial, sans-serif; padding: 16px; color: #1a202c;">
    <h2 style="margin-bottom: 12px;">${title}</h2>
    ${bodyContent}
  </div>
  `;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const hasCredentials = Boolean(user && pass);
  const isProduction = process.env.NODE_ENV === "production";

  if (hasCredentials) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    // Verify transport on startup to surface auth errors early
    transporter.verify().catch((err) => {
      console.error("Email transporter verification failed:", err);
    });
  } else if (!isProduction) {
    // Dev fallback: don't break flows if email creds are missing; log emails to console
    console.warn("EMAIL_USER/EMAIL_PASSWORD missing. Using JSON transport (emails logged, not sent).");
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    throw new Error("EMAIL_USER or EMAIL_PASSWORD is not set");
  }

  return transporter;
}

export async function sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
  const mailer = getTransporter();
  const info = await mailer.sendMail({
    from: process.env.EMAIL_USER || "no-reply@example.com",
    ...options,
  });

  if ((mailer as any).options?.jsonTransport) {
    console.info("Email (dev mode, not sent):", info.message);
  }
}
