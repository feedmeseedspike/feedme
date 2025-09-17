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

interface NewsletterEmailProps {
  customerName?: string;
  month?: string;
  year?: string;
  newsletterTitle?: string;
  bannerImage?: string;
  mainContentHtml?: string; // rich HTML from editor
  featuredProducts?: Array<{
    name: string;
    description: string;
    price: string;
    image: string;
    productUrl: string;
  }>;
  bundles?: Array<{
    name: string;
    description: string;
    price?: string;
    bundleUrl: string;
  }>;
  productsHeading?: string;
  bundlesHeading?: string;
  shopUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

const NewsletterEmail = ({
  customerName = "Valued Customer",
  month = "This Month",
  year = new Date().getFullYear().toString(),
  newsletterTitle = "Fresh Updates from FeedMe",
  bannerImage,
  mainContentHtml,
  featuredProducts = [
    {
      name: "Fresh Tomatoes",
      description: "Juicy, vine-ripened tomatoes perfect for your meals",
      price: "₦2,500/kg",
      image:
        "https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png",
      productUrl: "https://shopfeedme.com/products/fresh-tomatoes",
    },
    {
      name: "Organic Spinach",
      description: "Nutrient-rich spinach leaves, freshly harvested",
      price: "₦1,800/bunch",
      image:
        "https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png",
      productUrl: "https://shopfeedme.com/products/organic-spinach",
    },
  ],
  bundles = [],
  productsHeading = "🥬 Featured This Month",
  bundlesHeading = "🎁 Bundle Deals",
  shopUrl = "https://shopfeedme.com",
  unsubscribeUrl = "#",
  preferencesUrl = "#",
}: NewsletterEmailProps) => {
  const chunkIntoPairs = <T,>(items: T[]): T[][] => {
    const pairs: T[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([items[i], items[i + 1] as T]);
    }
    return pairs;
  };
  return (
    <Html>
      <Head />
      <Preview>
        Fresh Updates from FeedMe - {month} {year}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
              width="120"
              height="37"
              alt="FeedMe"
              style={{ ...logo, width: 120, height: 37 }}
            />
          </Section>

          {/* Title */}
          <Section style={titleSection}>
            <Heading style={title}>{newsletterTitle}</Heading>
            <Text style={subtitle}>
              {month} {year}
            </Text>
          </Section>

          {bannerImage ? (
            <Section style={{ padding: "0 20px 10px" }}>
              <Img
                src={bannerImage}
                alt="Newsletter Banner"
                style={{ width: "100%", height: "auto", borderRadius: 6 }}
              />
            </Section>
          ) : null}

          {/* Greeting */}
          <Section>
            <Heading as="h2" style={greeting}>
              Hi {customerName},
            </Heading>
            <Text style={introText}>
              Here are this month&#39;s freshest updates and seasonal picks just
              for you! Our farmers have been working hard to bring you the best
              quality produce.
            </Text>
          </Section>

          {/* Main Content (rich HTML) */}
          {mainContentHtml ? (
            <Section style={{ padding: "0 20px 10px" }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: mainContentHtml.replace(/'/g, "&#39;"),
                }}
              />
            </Section>
          ) : null}

          {/* Featured Products */}
          {featuredProducts && featuredProducts.length > 0 ? (
            <Section>
              <Heading as="h3" style={sectionHeading}>
                {productsHeading}
              </Heading>
              {chunkIntoPairs(featuredProducts).map((pair, idx) => (
                <Section key={idx} style={{ padding: "0 20px 0" }}>
                  <Row>
                    {pair[0] ? (
                      <Column style={{ width: "50%" }}>
                        <Section style={productCard}>
                          <Img
                            src={pair[0].image}
                            width="120"
                            height="120"
                            alt={pair[0].name}
                            style={{ ...productImage, margin: "0 auto 10px" }}
                          />
                          <Heading as="h4" style={productName}>
                            {pair[0].name}
                          </Heading>
                          {pair[0].description ? (
                            <Text style={productDescription}>
                              {pair[0].description}
                            </Text>
                          ) : null}
                          {pair[0].price ? (
                            <Text style={productPrice}>{pair[0].price}</Text>
                          ) : null}
                          <Button
                            href={pair[0].productUrl}
                            style={productButton}
                          >
                            Shop Now
                          </Button>
                        </Section>
                      </Column>
                    ) : (
                      <Column style={{ width: "50%" }} />
                    )}
                    {pair[1] ? (
                      <Column style={{ width: "50%" }}>
                        <Section style={productCard}>
                          <Img
                            src={pair[1].image}
                            width="120"
                            height="120"
                            alt={pair[1].name}
                            style={{ ...productImage, margin: "0 auto 10px" }}
                          />
                          <Heading as="h4" style={productName}>
                            {pair[1].name}
                          </Heading>
                          {pair[1].description ? (
                            <Text style={productDescription}>
                              {pair[1].description}
                            </Text>
                          ) : null}
                          {pair[1].price ? (
                            <Text style={productPrice}>{pair[1].price}</Text>
                          ) : null}
                          <Button
                            href={pair[1].productUrl}
                            style={productButton}
                          >
                            Shop Now
                          </Button>
                        </Section>
                      </Column>
                    ) : (
                      <Column style={{ width: "50%" }} />
                    )}
                  </Row>
                </Section>
              ))}
            </Section>
          ) : null}

          {/* Bundles - full width list */}
          {bundles && bundles.length > 0 ? (
            <Section>
              <Heading as="h3" style={sectionHeading}>
                {bundlesHeading}
              </Heading>
              {bundles.map((bundle, i) => (
                <Section key={i} style={productCard}>
                  <Heading as="h4" style={productName}>
                    {bundle.name}
                  </Heading>
                  {bundle.description ? (
                    <Text style={productDescription}>{bundle.description}</Text>
                  ) : null}
                  {bundle.price ? (
                    <Text style={productPrice}>{bundle.price}</Text>
                  ) : null}
                  <Button href={bundle.bundleUrl} style={productButton}>
                    Get Bundle
                  </Button>
                </Section>
              ))}
            </Section>
          ) : null}

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Discover more fresh, farm-to-table produce delivered in 3 hours!
            </Text>
            <Button href={shopUrl} style={mainCta}>
              Browse All Products
            </Button>
          </Section>

          {/* Optional extra tips could go here if needed */}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You&#39;re receiving this because you&#39;re subscribed to FeedMe
              newsletters.
            </Text>
            <Text style={footerLinks}>
              <Link href={preferencesUrl} style={footerLink}>
                Email Preferences
              </Link>
              {" | "}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={companyInfo}>
              FeedMe - Real Food, Real Fast, Delivered in 3 Hours
              <br />
              Lagos, Nigeria
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NewsletterEmail;

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
};

const header = {
  padding: "20px 0",
  textAlign: "center" as const,
  borderBottom: "1px solid #eee",
};

const logo = {
  margin: "0 auto",
  height: 37,
  width: 120,
};

const titleSection = {
  padding: "30px 20px 20px",
  textAlign: "center" as const,
};

const title = {
  color: "#1B6013",
  fontSize: "28px",
  fontWeight: "bold",
  lineHeight: "1.3",
  margin: "0 0 10px 0",
};

const subtitle = {
  color: "#666666",
  fontSize: "16px",
  margin: "0",
};

const greeting = {
  color: "#333333",
  fontSize: "20px",
  fontWeight: "600",
  margin: "30px 0 15px 0",
  padding: "0 20px",
};

const introText = {
  color: "#666666",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 30px 0",
  padding: "0 20px",
};

const sectionHeading = {
  color: "#1B6013",
  fontSize: "20px",
  fontWeight: "600",
  margin: "30px 0 20px 0",
  padding: "0 20px",
};

const productCard = {
  border: "1px solid #eee",
  borderRadius: "8px",
  margin: "0 20px 20px 20px",
  padding: "20px",
};

const productImage = {
  borderRadius: "6px",
  objectFit: "cover" as const,
};

const productName = {
  color: "#1B6013",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const productDescription = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 10px 0",
};

const productPrice = {
  color: "#333333",
  fontSize: "16px",
  fontWeight: "bold",
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

const ctaSection = {
  padding: "40px 20px",
  textAlign: "center" as const,
  backgroundColor: "#f8f8f8",
};

const ctaText = {
  color: "#333333",
  fontSize: "18px",
  lineHeight: "1.5",
  margin: "0 0 25px 0",
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
};

const tipsSection = {
  padding: "30px 20px",
  backgroundColor: "#f0f7ed",
};

const tipText = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 15px 0",
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

const footerLinks = {
  fontSize: "12px",
  margin: "0 0 15px 0",
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
