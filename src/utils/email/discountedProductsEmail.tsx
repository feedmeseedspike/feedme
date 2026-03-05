import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Heading,
  Button,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface Product {
  name: string;
  originalPrice: string;
  salePrice: string;
  discountPercentage: string;
  image: string;
  productUrl: string;
}

interface DiscountedProductsEmailProps {
  customerName?: string;
  products: Product[];
  shopUrl?: string;
  unsubscribeUrl?: string;
  supportText?: string;
  showUnsubscribe?: boolean;
}

const DiscountedProductsEmail = ({
  customerName = "Valued Customer",
  products = [],
  shopUrl = "https://shopfeedme.com",
  unsubscribeUrl = "#",
  supportText,
  showUnsubscribe = true,
}: DiscountedProductsEmailProps) => {
  // Chunk products into groups of 3 for 3-column layout
  const rows = [];
  for (let i = 0; i < products.length; i += 3) {
    rows.push(products.slice(i, i + 3));
  }

  return (
    <Html>
      <Head />
      <Preview>🔥 Massive Deals on FeedMe! Fresh Discounts just for you.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
              width="120"
              height="37"
              alt="FeedMe"
              style={logo}
            />
          </Section>

          {/* Hero Banner */}
          <Section style={hero}>
            <Heading style={heroTitle}>DEALS OF THE DAY</Heading>
            <Text style={heroSubtitle}>Massive 10% OFF your favorite items!</Text>
          </Section>

          {/* Greeting */}
          <Section style={contentSection}>
            <Heading as="h2" style={greeting}>
              Hello {customerName},
            </Heading>
            <Text style={introText}>
              We&apos;ve picked out some amazing discounts just for you. Don&apos;t miss out on these limited-time offers!
            </Text>
          </Section>

          {/* Product Listing - 3 Column Grid */}
          <Section style={productGridSection}>
            {rows.map((rowItems, rowIndex) => (
              <Row key={rowIndex} style={productRow}>
                {rowItems.map((product, colIndex) => (
                  <Column key={colIndex} style={productColumn}>
                    <Section style={productCard}>
                      <Section style={imageSection}>
                        <Img
                          src={product.image}
                          width="160"
                          height="160"
                          alt={product.name}
                          style={productImage}
                        />
                      </Section>
                      <Section style={productInfo}>
                        <Text style={discountBadge}>-{product.discountPercentage} OFF</Text>
                        <Text style={productName}>{product.name}</Text>
                        <Text style={salePrice}>{product.salePrice}</Text>
                        <Text style={originalPrice}>{product.originalPrice}</Text>
                        <Button href={product.productUrl} style={buyButton}>
                          BUY NOW
                        </Button>
                      </Section>
                    </Section>
                  </Column>
                ))}
                {/* Fill empty columns if row is not full */}
                {rowItems.length < 3 && 
                  Array.from({ length: 3 - rowItems.length }).map((_, i) => (
                    <Column key={`empty-${i}`} style={productColumn} />
                  ))
                }
              </Row>
            ))}
          </Section>

          {/* CTA Footer */}
          <Section style={ctaSection}>
            <Button href={`${shopUrl}/discounted`} style={viewAllButton}>
              VIEW ALL DEALS
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            {supportText && (
              <Text style={supportTextStyle}>
                Need help placing an order or bulk orders?{" "}
                <Link href="tel:+2348088282487" style={{ color: "#1B6013", textDecoration: "underline" }}>
                  Call +2348088282487
                </Link>
              </Text>
            )}
            <Text style={footerText}>
              Lagos, Nigeria | Delivered in 3 Hours
            </Text>
            {showUnsubscribe && (
              <Text style={footerText}>
                <Link href={unsubscribeUrl} style={footerLink}>
                  Unsubscribe
                </Link>
              </Text>
            )}
            <Text style={companyInfo}>
              © {new Date().getFullYear()} FeedMe Limited. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DiscountedProductsEmail;

// Styles - Email compatible
const main = {
  backgroundColor: "#f4f4f4",
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const header = {
  padding: "20px 0",
  textAlign: "center" as const,
  backgroundColor: "#ffffff",
};

const logo = {
  margin: "0 auto",
};

const hero = {
  backgroundColor: "#F0800F",
  padding: "30px 20px",
  textAlign: "center" as const,
};

const heroTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0 0 10px 0",
};

const heroSubtitle = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "0",
};

const contentSection = {
  padding: "30px 20px 10px",
  textAlign: "center" as const,
};

const greeting = {
  fontSize: "20px",
  color: "#333",
  margin: "0 0 10px 0",
};

const introText = {
  color: "#666",
  fontSize: "14px",
  margin: "0 0 10px 0",
  lineHeight: "1.5",
};

const productGridSection = {
  padding: "10px",
};

const productRow = {
  marginBottom: "10px",
};

const productColumn = {
  padding: "5px",
  verticalAlign: "top",
};

const productCard = {
  border: "1px solid #f0f0f0",
  borderRadius: "4px",
  overflow: "hidden" as const,
  width: "100%",
};

const imageSection = {
  backgroundColor: "#f9f9f9",
  height: "160px",
  textAlign: "center" as const,
  display: "table-cell",
  verticalAlign: "middle",
  width: "280px", // Approximate for 2-col
};

const productImage = {
  maxWidth: "100%",
  maxHeight: "160px",
  margin: "0 auto",
  display: "block",
};

const productInfo = {
  padding: "10px",
  height: "160px", // Fixed height for info area to align buttons
};

const discountBadge = {
  backgroundColor: "#1B6013",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: "bold" as const,
  padding: "2px 6px",
  borderRadius: "2px",
  margin: "0 0 5px 0",
  display: "inline-block",
};

const productName = {
  fontSize: "13px",
  color: "#333",
  margin: "0 0 5px 0",
  fontWeight: "bold" as const,
  height: "32px",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
};

const salePrice = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#000",
  margin: "0 0 2px 0",
};

const originalPrice = {
  fontSize: "12px",
  color: "#999",
  textDecoration: "line-through",
  margin: "0 0 10px 0",
  height: "15px",
};

const buyButton = {
  backgroundColor: "#F0800F",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "bold" as const,
  padding: "8px 0",
  borderRadius: "4px",
  textDecoration: "none",
  display: "block",
  textAlign: "center" as const,
  marginTop: "auto",
};

const ctaSection = {
  padding: "20px",
  textAlign: "center" as const,
};

const viewAllButton = {
  backgroundColor: "#1B6013",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "bold" as const,
  padding: "12px 30px",
  borderRadius: "4px",
  textDecoration: "none",
  display: "inline-block",
};

const footer = {
  padding: "30px 20px",
  textAlign: "center" as const,
  backgroundColor: "#f9f9f9",
};

const supportTextStyle = {
  fontSize: "14px",
  color: "#333",
  fontWeight: "bold" as const,
  margin: "0 0 15px 0",
};

const footerText = {
  fontSize: "12px",
  color: "#999",
  margin: "0 0 5px 0",
};

const footerLink = {
  color: "#1B6013",
};

const companyInfo = {
  fontSize: "11px",
  color: "#999",
  marginTop: "10px",
};
