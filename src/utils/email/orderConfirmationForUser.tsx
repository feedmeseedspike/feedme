"use server";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface Item {
  title: string;
  price: number;
  quantity: number;
}

export interface CustomerOrderReceivedProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemsOrdered: Item[];
  deliveryAddress: string;
  deliveryFee: number;
  serviceCharge: number;
  totalAmount: number;
  totalAmountPaid: number;
}

const tableHeaderStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f4f4f4",
};

const tableCellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

export function CustomerOrderReceived(props: CustomerOrderReceivedProps) {
  const {
    orderNumber,
    customerName,
    customerPhone,
    itemsOrdered,
    deliveryAddress,
    deliveryFee,
    serviceCharge,
    totalAmount,
    totalAmountPaid,
  } = props;
  const previewText = `Order Confirmed! Your Fresh Produce is On Its Way`;
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="auto"
                height="37"
                alt="Creed"
                className="my-0"
              />
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              {previewText}
            </Text>
            <Text>
              Hi {customerName}, Thank you for shopping with{" "}
              <strong>FeedMe!</strong> We&apos;re excited to bring you fresh,
              quality produce straight to your doorstep. Here are your order
              details:
            </Text>
            <Text>
              <strong>Order Summary</strong>
              <ul>
                <li>
                  {" "}
                  <strong> Order Number : </strong>
                  {orderNumber}
                </li>
                <li>
                  <strong>Delivery Time:</strong> {"3 hours or less"}
                </li>
                <li>
                  {" "}
                  <strong> Delivery Address : </strong>
                  {deliveryAddress}
                </li>
                <li>
                  <strong>Contact Phone:</strong>
                  {customerPhone}
                </li>
              </ul>
            </Text>
            <Text>
              <h2>Items Ordered</h2>
            </Text>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>PRODUCT NAME</th>
                  <th style={tableHeaderStyle}>PRICE</th>
                  <th style={tableHeaderStyle}>QTY</th>
                  <th style={tableHeaderStyle}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {itemsOrdered.map((item, index) => {
                  const subtotal = item.price * item.quantity;
                  return (
                    <tr key={index}>
                      <td style={tableCellStyle}>{item.title}</td>
                      <td style={tableCellStyle}>
                        ₦{item.price.toLocaleString()}
                      </td>
                      <td style={tableCellStyle}>{item.quantity}</td>
                      <td style={tableCellStyle}>
                        ₦{subtotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Total Cost Of Items:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>#{totalAmount}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Discount Amount:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>
                      {" "}
                      - #
                      {totalAmount +
                        deliveryFee +
                        serviceCharge -
                        totalAmountPaid}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Cost After Discount:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>
                      {" "}
                      #{totalAmountPaid - (deliveryFee + serviceCharge)}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Service Charge:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>₦{serviceCharge.toLocaleString()}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Delivery Fee:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>₦{deliveryFee.toLocaleString()}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Total:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>#{totalAmountPaid.toLocaleString()}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text>
              <strong>What&apos;s Next?</strong>
              <br />
              <ul>
                <li>
                  Your order is being packed with care and will soon be on its
                  way.
                </li>
                <li>
                  We&apos;ll notify you once your order is out for delivery.
                </li>
              </ul>
            </Text>
            <Text>
              We carefully inspect every item to ensure it meets our freshness
              and quality standards. However, if something doesn&apos;t feel
              right, please reach out to us immediately after delivery at{" "}
              <strong> +2348088282487</strong>.
            </Text>
            <Text>
              Thank you for choosing <strong>FeedMe</strong>. We&apos;re proud
              to connect you with the best farm fresh produce!
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Section className="mt-[32px]">
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="auto"
                height="15"
                alt="Creed"
                className="my-0"
              />
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export function CustomerOrderReceivedTemplate(
  props: CustomerOrderReceivedProps
): string {
  return renderToStaticMarkup(<CustomerOrderReceived {...props} />);
}
