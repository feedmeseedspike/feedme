import React from "react";
import { render } from "@react-email/render";
import OrderConfirmation from "./orderConfirmation";
import OrderConfirmationForUser from "./orderConfirmationForUser";

export async function renderOrderEmails({
  adminOrderProps,
  userOrderProps,
}: {
  adminOrderProps: any;
  userOrderProps: any;
}): Promise<{ adminHtml: string; userHtml: string }> {
  const adminHtml = await render(<OrderConfirmation {...adminOrderProps} />);
  const userHtml = await render(
    <OrderConfirmationForUser {...userOrderProps} />
  );
  return { adminHtml, userHtml };
}
