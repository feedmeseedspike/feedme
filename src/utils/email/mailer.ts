import nodemailer from "nodemailer";

// Hardcoded SMTP Settings
const smtpHost = "smtp.gmail.com";
const smtpPort = 587; // Changed to 587 to avoid ETIMEDOUT on 465
const smtpUser = "orders.feedmeafrica@gmail.com";
const smtpPass = "cyma apwl rnam vdip"; // App Password
const smtpSecure = false; // Must be false for port 587 (STARTTLS)
const defaultFrom = smtpUser;

/*
const smtpHost = process.env.SMTP_HOST || process.env.NODEMAILER_HOST;
const smtpPortEnv = process.env.SMTP_PORT || process.env.NODEMAILER_PORT;
const smtpPort = smtpPortEnv ? Number(smtpPortEnv) : undefined;
const smtpUser = process.env.SMTP_USER || process.env.NODEMAILER_USER;
const smtpPass = process.env.SMTP_PASS || process.env.NODEMAILER_PASS;
const smtpSecureEnv = process.env.SMTP_SECURE j|| process.env.NODEMAILER_SECURE;
const smtpSecure = smtpSecureEnv
  ? smtpSecureEnv.toLowerCase() === "true"
  : smtpPort === 465;
const defaultFrom = process.env.SMTP_FROM || process.env.NODEMAILER_FROM || smtpUser;
*/

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    "SMTP credentials are not fully configured. Email sending will fail until SMTP_HOST (or NODEMAILER_HOST), SMTP_USER (or NODEMAILER_USER), and SMTP_PASS (or NODEMAILER_PASS) are set."
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: { user: smtpUser, pass: smtpPass },
  tls: {
    rejectUnauthorized: false, // Ensure it works in dev even if certs are strict
    ciphers: "SSLv3",
  },
});

export async function sendMail({
  to,
  subject,
  html,
  from,
  cc,
  bcc,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}) {
  const mailOptions = {
    from: from || defaultFrom,
    to,
    subject,
    html,
    cc,
    bcc,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw error;
  }
} 