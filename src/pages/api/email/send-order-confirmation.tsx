import type { NextApiRequest, NextApiResponse } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CustomerOrder,
  CustomerOrderProps,
} from "src/utils/email/orderConfirmation";
import {
  CustomerOrderReceived,
  CustomerOrderReceivedProps,
} from "src/utils/email/orderConfirmationForUser";
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

async function sendEmail({
  from,
  subject,
  html,
  to,
}: {
  from: string;
  subject: string;
  html: string;
  to: string;
}) {
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    subject,
    html,
    to,
  };
  await transporter.sendMail(mailOptions);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }
  try {
    const { type, to, subject, orderProps } = req.body as {
      type: "admin" | "customer";
      to: string;
      subject: string;
      orderProps: CustomerOrderProps | CustomerOrderReceivedProps;
    };

    let html = "";
    if (type === "admin") {
      html = renderToStaticMarkup(
        <CustomerOrder {...(orderProps as CustomerOrderProps)} />
      );
    } else if (type === "customer") {
      html = renderToStaticMarkup(
        <CustomerOrderReceived
          {...(orderProps as CustomerOrderReceivedProps)}
        />
      );
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email type" });
    }

    await sendEmail({
      from: process.env.NODEMAILER_USER!,
      subject,
      html,
      to,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
