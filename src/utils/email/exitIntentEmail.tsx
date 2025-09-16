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

export interface ExitIntentEmailProps {
  customerName: string;
  discountCode: string;
  discountPercentage: number;
}

export function ExitIntentEmail(props: ExitIntentEmailProps) {
  const { customerName, discountCode, discountPercentage } = props;
  const previewText = `Don't miss out! Your ${discountPercentage}% discount is waiting`;

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
              Don&apos;t leave empty-handed! 🛒
            </Text>

            <Text className="text-black text-[16px] leading-[24px]">
              Hi {customerName},
            </Text>

            <Text className="text-black text-[16px] leading-[24px]">
              We noticed you were browsing <strong>FeedMe</strong> -
              Nigeria&apos;s freshest produce delivery service! Don&apos;t miss
              out on farm-fresh fruits and vegetables delivered to your doorstep
              in just 3 hours.
            </Text>

            <Section className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-dashed border-orange-300 rounded-lg p-6 my-8 text-center">
              <Text className="text-orange-800 text-[20px] font-bold mb-3">
                🎁 Your Special Discount is Here!
              </Text>
              <Text className="text-orange-700 text-[16px] mb-4">
                Get <strong>{discountPercentage}% OFF</strong> your first order
                today!
              </Text>
              <Text className="text-orange-800 text-[24px] font-bold bg-white inline-block px-6 py-3 rounded-lg border-2 border-orange-400 mb-4">
                {discountCode}
              </Text>
              <Text className="text-orange-600 text-[12px]">
                Valid for 7 days • Use at checkout
              </Text>
            </Section>

            <Text className="text-black text-[16px] leading-[24px]">
              <strong>Why choose FeedMe?</strong>
            </Text>

            <Text className="text-black text-[14px] leading-[22px]">
              🥬 <strong>Farm-Fresh Quality:</strong> Handpicked from trusted
              local farms
              <br />⚡ <strong>Lightning Fast:</strong> Fresh produce delivered
              in 3 hours or less
              <br />✅ <strong>Quality Promise:</strong> 100% satisfaction
              guaranteed
              <br />
              💚 <strong>Support Local:</strong> Empowering Nigerian farmers
              <br />
              📱 <strong>Easy Ordering:</strong> Simple app, seamless experience
            </Text>

            <Section className="text-center my-8">
              <Button
                href={`${process.env.NEXT_PUBLIC_SITE_URL}`}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-lg text-[16px] font-semibold"
              >
                Shop Now & Save {discountPercentage}%
              </Button>
            </Section>

            <Section className="bg-gray-50 p-4 rounded-lg my-6">
              <Text className="text-gray-800 text-[14px] font-semibold mb-2">
                🔥 Popular This Week:
              </Text>
              <Text className="text-gray-700 text-[13px] leading-[18px]">
                • Fresh Tomatoes & Peppers
                <br />
                • Organic Spinach & Lettuce
                <br />
                • Sweet Pineapples & Mangoes
                <br />• Farm-fresh Eggs & More!
              </Text>
            </Section>

            <Text className="text-black text-[16px] leading-[24px]">
              Ready to taste the difference? Use code{" "}
              <strong>{discountCode}</strong> at checkout and enjoy{" "}
              {discountPercentage}% off your first order.
            </Text>

            <Text className="text-black text-[14px] leading-[20px] text-gray-600">
              Questions? We&apos;re here to help! Contact us at{" "}
              <strong>+2348088282487</strong> or reply to this email.
            </Text>

            <Text className="text-black text-[16px] leading-[24px]">
              Fresh regards,
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
              You&apos;re receiving this email because you showed interest in
              FeedMe. This offer expires in 7 days. <br />
              Not interested? You can unsubscribe at any time.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ExitIntentEmail;
