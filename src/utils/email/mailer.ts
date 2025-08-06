import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "orders.feedmeafrica@gmail.com",
    pass: "cyma apwl rnam vdip",
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
    from: "orders.feedmeafrica@gmail.com",
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
} 