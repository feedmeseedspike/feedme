import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || process.env.NODEMAILER_HOST || "smtp.gmail.com";
const smtpPortEnv = process.env.SMTP_PORT || process.env.NODEMAILER_PORT;
const smtpPort = smtpPortEnv ? Number(smtpPortEnv) : 465;
const smtpUser = process.env.SMTP_USER || process.env.NODEMAILER_USER || "orders.feedmeafrica@gmail.com";
const smtpPass = process.env.SMTP_PASS || process.env.NODEMAILER_PASS || "cyma apwl rnam vdip";
const smtpSecureEnv = process.env.SMTP_SECURE || process.env.NODEMAILER_SECURE;
const smtpSecure = smtpSecureEnv
  ? smtpSecureEnv.toLowerCase() === "true"
  : smtpPort === 465;
const defaultFrom = process.env.SMTP_FROM || process.env.NODEMAILER_FROM || smtpUser;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    "SMTP credentials are not fully configured. Email sending will fail."
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: { 
    user: smtpUser, 
    pass: smtpPass 
  },
  logger: true, // Log to console
  debug: true,  // Include debug info
  tls: {
    rejectUnauthorized: false
  }
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