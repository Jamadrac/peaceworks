"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.generateEmailLayout = generateEmailLayout;
exports.sendMail = sendMail;
const crypto_1 = require("crypto");
const nodemailer_1 = __importDefault(require("nodemailer"));
function generateOTP(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String((0, crypto_1.randomInt)(min, max + 1));
}
function generateEmailLayout(params) {
    const { title, bodyContent } = params;
    return `
  <div style="font-family: Arial, sans-serif; padding: 16px; color: #1a202c;">
    <h2 style="margin-bottom: 12px;">${title}</h2>
    ${bodyContent}
  </div>
  `;
}
let transporter = null;
function getTransporter() {
    if (transporter)
        return transporter;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const hasCredentials = Boolean(user && pass);
    const isProduction = process.env.NODE_ENV === "production";
    if (hasCredentials) {
        transporter = nodemailer_1.default.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user, pass },
        });
        // Verify transport on startup to surface auth errors early
        transporter.verify().catch((err) => {
            console.error("Email transporter verification failed:", err);
        });
    }
    else if (!isProduction) {
        // Dev fallback: don't break flows if email creds are missing; log emails to console
        console.warn("EMAIL_USER/EMAIL_PASSWORD missing. Using JSON transport (emails logged, not sent).");
        transporter = nodemailer_1.default.createTransport({ jsonTransport: true });
    }
    else {
        throw new Error("EMAIL_USER or EMAIL_PASSWORD is not set");
    }
    return transporter;
}
async function sendMail(options) {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
        from: process.env.EMAIL_USER || "no-reply@example.com",
        ...options,
    });
    if (mailer.options?.jsonTransport) {
        console.info("Email (dev mode, not sent):", info.message);
    }
}
