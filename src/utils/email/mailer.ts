import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  port: Number(process.env.NODEMAILER_PORT),
  host: process.env.NODEMAILER_HOST,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
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