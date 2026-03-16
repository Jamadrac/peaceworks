import { randomInt } from "crypto";

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

export async function sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
  // Stubbed mailer for local dev. Replace with real SMTP integration later.
  console.log("[sendMail stub]", { to: options.to, subject: options.subject });
}
