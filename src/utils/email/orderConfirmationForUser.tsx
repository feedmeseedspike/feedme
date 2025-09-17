import React from "react";
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
  customizations?: Record<string, string>;
  optionName?: string;
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
  paymentMethod?: string;
  voucherDiscount?: number;
  voucherCode?: string;
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

function formatNaira(amount: number) {
  return amount.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

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
    paymentMethod,
    voucherDiscount,
    voucherCode,
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
                      <td style={tableCellStyle}>
                        <div>
                          <strong>{item.title}</strong>
                          {item.optionName && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              Variation: {item.optionName}
                            </div>
                          )}
                          {item.customizations && Object.keys(item.customizations).length > 0 && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {Object.entries(item.customizations).map(([key, value]) => (
                                <div key={key} style={{ marginTop: '1px' }}>
                                  • {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{formatNaira(item.price)}</td>
                      <td style={tableCellStyle}>{item.quantity}</td>
                      <td style={tableCellStyle}>{formatNaira(subtotal)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Total Cost Of Items:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>{formatNaira(totalAmount)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Discount Amount:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong> - {formatNaira(voucherDiscount || 0)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Cost After Discount:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>
                      {" "}
                      {formatNaira(totalAmount - (voucherDiscount || 0))}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Service Charge:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>{formatNaira(serviceCharge)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Delivery Fee:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>{formatNaira(deliveryFee)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle} colSpan={3} align="right">
                    <strong>Total:</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <strong>{formatNaira(totalAmountPaid)}</strong>
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

export default CustomerOrderReceived;
