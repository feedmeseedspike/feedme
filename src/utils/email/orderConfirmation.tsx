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

export interface CustomerOrderProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemsOrdered: Item[];
  deliveryAddress: string;
  localGovernment: string;
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

export default function CustomerOrder(props: CustomerOrderProps) {
  const {
    orderNumber,
    customerName,
    customerPhone,
    itemsOrdered,
    deliveryAddress,
    localGovernment,
  } = props;
  const previewText = `New Order Received -${orderNumber}`;
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
            <Text className="text-black text-[14px] leading-[24px]">
              Order Details
            </Text>
            <br />
            <Text>
              <strong>Order Details</strong>
              <ul>
                <li>
                  {" "}
                  <strong> Order Number : </strong>
                  {orderNumber}
                </li>
                <li>
                  {" "}
                  <strong> Customer Name : </strong>
                  {customerName}
                </li>
                <li>
                  {" "}
                  <strong> Customer Phone : </strong>
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
              </tbody>
            </table>
            <Text>
              <strong>Delivery Address</strong>
              <br />
              {localGovernment}
              <br />
              {deliveryAddress}
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


