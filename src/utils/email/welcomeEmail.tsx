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
  Button,
} from "@react-email/components";

export interface WelcomeEmailProps {
  customerName: string;
  discountCode: string;
  discountPercentage: number;
}

export function WelcomeEmail(props: WelcomeEmailProps) {
  const { customerName, discountCode, discountPercentage } = props;
  const previewText = `Welcome to FeedMe - Get ${discountPercentage}% off your first order!`;

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
                alt="FeedMe"
                className="my-0"
              />
            </Section>

            <Text className="text-black text-[24px] leading-[32px] font-bold text-center mt-8">
              Welcome to FeedMe! 🎉
            </Text>

            <Text className="text-black text-[16px] leading-[24px]">
              Hi {customerName},
            </Text>

            <Text className="text-black text-[16px] leading-[24px]">
              Welcome to <strong>FeedMe</strong> - your gateway to fresh,
              quality produce delivered straight to your doorstep! We&apos;re
              thrilled to have you join our community of food lovers who value
              freshness and quality.
            </Text>

            <Section className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 my-6 text-center">
              <Text className="text-green-800 text-[18px] font-bold mb-2">
                🎁 Special Welcome Offer!
              </Text>
              <Text className="text-green-700 text-[16px] mb-3">
                Get <strong>{discountPercentage}% OFF</strong> your first order
              </Text>
              <Text className="text-green-800 text-[20px] font-bold bg-white inline-block px-4 py-2 rounded border-2 border-green-400">
                Code: {discountCode}
              </Text>
              <Text className="text-green-600 text-[12px] mt-2">
                Valid for 30 days from signup
              </Text>
            </Section>

            <Text className="text-black text-[16px] leading-[24px]">
              <strong>What makes FeedMe special?</strong>
            </Text>

            <Text className="text-black text-[14px] leading-[22px]">
              ✅ <strong>Farm-Fresh Quality:</strong> We carefully source from
              trusted local farmers
              <br />✅ <strong>Fast Delivery:</strong> Fresh produce delivered
              in 4 hours or less
              <br />✅ <strong>Quality Guarantee:</strong> Every item is
              inspected for freshness
              <br />✅ <strong>Wide Selection:</strong> From fruits to
              vegetables, we&apos;ve got you covered
            </Text>

            <Section className="text-center my-8">
              <Button
                href={`${process.env.NEXT_PUBLIC_SITE_URL}`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg text-[16px] font-semibold"
              >
                Start Shopping Now
              </Button>
            </Section>

            <Text className="text-black text-[16px] leading-[24px]">
              Ready to experience the freshest produce? Use your welcome
              discount code <strong>{discountCode}</strong> at checkout to save{" "}
              {discountPercentage}% on your first order.
            </Text>

            <Text className="text-black text-[14px] leading-[20px]">
              Need help getting started? We&apos;re here for you! Reach out to
              us at <strong>+2348088282487</strong> or reply to this email.
            </Text>

            <Text className="text-black text-[16px] leading-[24px]">
              Welcome aboard,
              <br />
              <strong>The FeedMe Team</strong> 🌱
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section className="mt-[32px]">
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="auto"
                height="15"
                alt="FeedMe"
                className="my-0"
              />
            </Section>

            <Text className="text-gray-500 text-[12px] leading-[16px] text-center">
              You&apos;re receiving this email because you signed up for FeedMe.
              We&apos;re excited to serve you the freshest produce!
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
