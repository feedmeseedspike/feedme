import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
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