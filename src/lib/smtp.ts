import { createTransport, type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "mailpit";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 1025;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

const FROM_ADDRESS =
  process.env.SMTP_FROM || "Morning Money <daily@localhost>";

let transport: Transporter | null = null;

export function getTransport(): Transporter {
  if (!transport) {
    transport = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      ...(SMTP_USER && { auth: { user: SMTP_USER, pass: SMTP_PASS } }),
    });
  }
  return transport;
}

export function getFromAddress(): string {
  return FROM_ADDRESS;
}
