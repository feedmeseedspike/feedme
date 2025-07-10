import nodemailer from "nodemailer";

// Log all relevant env variables (mask password)
console.log("[Nodemailer ENV]", {
  NODEMAILER_USER: process.env.NODEMAILER_USER,
  NODEMAILER_PASS: process.env.NODEMAILER_PASS ? '***' : undefined,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST,
  NODEMAILER_PORT: process.env.NODEMAILER_PORT,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: Number(process.env.NODEMAILER_PORT),
  host: process.env.NODEMAILER_HOST,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  from: process.env.NODEMAILER_USER,
  secure: true,
});

export async function sendMail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const mailOptions = {
    from: from || process.env.NODEMAILER_USER,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
} 