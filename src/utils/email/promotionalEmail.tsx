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

interface PromotionalEmailProps {
  customerName?: string;
  discountPercentage?: number;
  promoCode?: string;
  expiryDate?: string;
  saleTitle?: string;
  saleDescription?: string;
  featuredProducts?: Array<{
    name: string;
    originalPrice: string;
    salePrice: string;
    savings: string;
    image: string;
    productUrl: string;
  }>;
  shopUrl?: string;
  unsubscribeUrl?: string;
}

const PromotionalEmail = ({
  customerName = "Valued Customer",
  discountPercentage = 20,
  promoCode = "FRESH20",
  expiryDate = "December 31, 2024",
  saleTitle = "Fresh Farm Sale",
  saleDescription = "Stock up on your favorite farm-fresh produce at unbeatable prices!",
  featuredProducts = [
    {
      name: "Premium Vegetables Bundle",
      originalPrice: "₦8,500",
      salePrice: "₦6,800",
      savings: "Save ₦1,700",
      image:
        "https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png",
      productUrl: "https://shopfeedme.com/products/vegetables-bundle",
    },
    {
      name: "Fresh Fruits Selection",
      originalPrice: "₦12,000",
      salePrice: "₦9,600",
      savings: "Save ₦2,400",
      image:
        "https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png",
      productUrl: "https://shopfeedme.com/products/fruits-selection",
    },
  ],
  shopUrl = "https://shopfeedme.com",
  unsubscribeUrl = "#",
}: PromotionalEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{`🎉 ${discountPercentage}% OFF Everything - Limited Time at FeedMe!`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Hero Section */}
          <Section style={hero}>
            <Img
              src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
              width="80"
              height="40"
              alt="FeedMe"
              style={heroLogo}
            />
            <Heading style={heroTitle}>
              {discountPercentage}% OFF EVERYTHING
            </Heading>
            <Text style={heroSubtitle}>{saleTitle} - Limited Time Only!</Text>
            <Text style={urgencyText}>⏰ Hurry! Sale ends {expiryDate}</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading as="h2" style={greeting}>
              Hi {customerName}!
            </Heading>
            <Text style={mainText}>{saleDescription}</Text>
            <Text style={mainText}>
              Use the code below to get{" "}
              <strong>{discountPercentage}% off</strong> your entire order.
              Fresh, authentic farm produce delivered to your doorstep in 3
              hours or less!
            </Text>
          </Section>

          {/* Promo Code Section */}
          <Section style={promoSection}>
            <Text style={promoLabel}>Your Exclusive Code:</Text>
            <Section style={promoCodeBox}>
              <Text style={promoCodeText}>{promoCode}</Text>
              <Text style={promoExpiryText}>Valid until {expiryDate}</Text>
            </Section>
            <Button href={shopUrl} style={mainCta}>
              Shop Now & Save {discountPercentage}%
            </Button>
          </Section>

          {/* Featured Products */}
          <Section style={productsSection}>
            <Heading as="h3" style={sectionHeading}>
              🔥 Hot Sale Items
            </Heading>

            <Row style={productsRow}>
              {featuredProducts.map((product, index) => (
                <Column key={index} style={productColumn}>
                  <Section style={productCard}>
                    <Img
                      src={product.image}
                      width="140"
                      height="140"
                      alt={product.name}
                      style={productImage}
                    />
                    <Heading as="h4" style={productName}>
                      {product.name}
                    </Heading>
                    <Section style={priceSection}>
                      <Text style={originalPrice}>{product.originalPrice}</Text>
                      <Text style={salePrice}>{product.salePrice}</Text>
                    </Section>
                    <Text style={savingsText}>{product.savings}</Text>
                    <Button href={product.productUrl} style={productButton}>
                      Shop Now
                    </Button>
                  </Section>
                </Column>
              ))}
            </Row>
          </Section>

          {/* Benefits Section */}
          <Section style={benefitsSection}>
            <Heading as="h3" style={benefitsTitle}>
              Why Choose FeedMe?
            </Heading>
            <Row>
              <Column style={{ width: "33%", textAlign: "center" }}>
                <Text style={benefitEmoji}>🚚</Text>
                <Text style={benefitTitle}>3-Hour Delivery</Text>
                <Text style={benefitText}>Fresh produce delivered fast</Text>
              </Column>
              <Column style={{ width: "33%", textAlign: "center" }}>
                <Text style={benefitEmoji}>🌱</Text>
                <Text style={benefitTitle}>Farm Fresh</Text>
                <Text style={benefitText}>Direct from Nigerian farms</Text>
              </Column>
              <Column style={{ width: "33%", textAlign: "center" }}>
                <Text style={benefitEmoji}>💰</Text>
                <Text style={benefitTitle}>Best Prices</Text>
                <Text style={benefitText}>Unbeatable quality & value</Text>
              </Column>
            </Row>
          </Section>

          {/* Final CTA */}
          <Section style={finalCtaSection}>
            <Text style={finalCtaText}>
              Don&apos;t miss out on these fresh savings!
            </Text>
            <Button href={shopUrl} style={finalCta}>
              Start Shopping with {discountPercentage}% OFF
            </Button>
            <Text style={reminderText}>
              Remember to use code: <strong>{promoCode}</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This promotional offer is exclusively for FeedMe customers.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe from promotional emails
              </Link>
            </Text>
            <Text style={companyInfo}>
              FeedMe - Real Food, Real Fast, Delivered in 3 Hours
              <br />
              Lagos, Nigeria | shopfeedme.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PromotionalEmail;

// Styles
const main = {
  backgroundColor: "#f9f9f9",
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const hero = {
  background: "linear-gradient(135deg, #1B6013 0%, #2d8f1e 100%)",
  color: "#ffffff",
  padding: "40px 20px",
  textAlign: "center" as const,
};

const heroLogo = {
  margin: "0 auto 20px auto",
  filter: "brightness(0) invert(1)",
};

const heroTitle = {
  fontSize: "32px",
  fontWeight: "bold",
  lineHeight: "1.2",
  margin: "0 0 10px 0",
  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
};

const heroSubtitle = {
  fontSize: "18px",
  margin: "0 0 15px 0",
  opacity: "0.9",
};

const urgencyText = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "20px",
  display: "inline-block",
  fontSize: "14px",
  margin: "0",
  padding: "8px 16px",
};

const contentSection = {
  padding: "30px 20px",
};

const greeting = {
  color: "#333333",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const mainText = {
  color: "#666666",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const promoSection = {
  padding: "30px 20px",
  textAlign: "center" as const,
  backgroundColor: "#f8f8f8",
};

const promoLabel = {
  color: "#333333",
  fontSize: "16px",
  margin: "0 0 15px 0",
};

const promoCodeBox = {
  backgroundColor: "#1B6013",
  border: "3px dashed #ffffff",
  borderRadius: "12px",
  margin: "0 auto 25px auto",
  maxWidth: "280px",
  padding: "20px",
};

const promoCodeText = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  letterSpacing: "2px",
  margin: "0 0 8px 0",
};

const promoExpiryText = {
  color: "rgba(255, 255, 255, 0.8)",
  fontSize: "12px",
  margin: "0",
};

const mainCta = {
  backgroundColor: "#1B6013",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "600",
  padding: "15px 30px",
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(27, 96, 19, 0.3)",
};

const productsSection = {
  padding: "40px 20px",
};

const sectionHeading = {
  color: "#1B6013",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 25px 0",
  textAlign: "center" as const,
};

const productsRow = {
  margin: "0 -10px",
};

const productColumn = {
  width: "50%",
  padding: "0 10px",
  verticalAlign: "top",
};

const productCard = {
  border: "1px solid #eee",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "0 0 20px 0",
  transition: "box-shadow 0.3s ease",
};

const productImage = {
  borderRadius: "6px",
  margin: "0 0 15px 0",
};

const productName = {
  color: "#333333",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 15px 0",
  lineHeight: "1.3",
};

const priceSection = {
  margin: "0 0 10px 0",
};

const originalPrice = {
  color: "#999999",
  fontSize: "14px",
  margin: "0 0 5px 0",
  textDecoration: "line-through",
};

const salePrice = {
  color: "#1B6013",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const savingsText = {
  color: "#e74c3c",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 15px 0",
};

const productButton = {
  backgroundColor: "#1B6013",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 20px",
  textDecoration: "none",
  display: "inline-block",
};

const benefitsSection = {
  backgroundColor: "#f0f7ed",
  padding: "40px 20px",
};

const benefitsTitle = {
  color: "#1B6013",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 30px 0",
  textAlign: "center" as const,
};

const benefitEmoji = {
  fontSize: "32px",
  margin: "0 0 10px 0",
};

const benefitTitle = {
  color: "#333333",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const benefitText = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "0",
};

const finalCtaSection = {
  padding: "40px 20px",
  textAlign: "center" as const,
};

const finalCtaText = {
  color: "#333333",
  fontSize: "18px",
  margin: "0 0 20px 0",
};

const finalCta = {
  backgroundColor: "#1B6013",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "15px 25px",
  textDecoration: "none",
  display: "inline-block",
  margin: "0 0 15px 0",
};

const reminderText = {
  color: "#666666",
  fontSize: "14px",
  margin: "0",
};

const footer = {
  borderTop: "1px solid #eee",
  padding: "30px 20px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#999999",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "0 0 10px 0",
};

const footerLink = {
  color: "#666666",
  textDecoration: "underline",
};

const companyInfo = {
  color: "#999999",
  fontSize: "11px",
  lineHeight: "1.4",
  margin: "0",
};
