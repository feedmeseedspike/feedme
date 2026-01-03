import React from "react";
import {
  Body,
  Button,
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

interface BirthdayEmailProps {
  customerName: string;
  favoriteFruit?: string;
}

export function BirthdayEmail({ customerName, favoriteFruit }: BirthdayEmailProps) {
  const previewText = `Happy Birthday from FeedMe! 🎂`;
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
            
            <Section className="text-center mt-[32px]">
               <h1 className="text-[#1B6013] text-2xl font-bold m-0">Happy Birthday, {customerName}! 🎉</h1>
            </Section>

            <Text className="text-black text-[16px] leading-[24px] mt-4">
              Happy Birthday! Everyone at FeedMe wants to wish you a year filled with joy, health, and delicious food.
            </Text>
            
            {favoriteFruit && (
               <Text className="text-black text-[16px] leading-[24px]">
                 We haven&apos;t forgotten about your love for <strong>{favoriteFruit}</strong>! 🍎
               </Text>
            )}

            <Text className="text-black text-[16px] leading-[24px] mt-6">
               May your day be filled with laughter, love, and your favorite meals. We&apos;re so glad to have you as part of our community, and we look forward to serving you another year of fresh, healthy produce.
            </Text>
            <Text className="text-black text-[16px] leading-[24px] mt-4">
               Treat yourself to something special today—you deserve it!
            </Text>

            <Section className="text-center mt-[24px] mb-[24px]">
              <Button
                className="bg-[#1B6013] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 cursor-pointer"
                href="https://www.shopfeedme.com/"
              >
                Visit Our Store
              </Button>
            </Section>

            <Text>
               Cheers,<br/>The FeedMe Team
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
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default BirthdayEmail;
