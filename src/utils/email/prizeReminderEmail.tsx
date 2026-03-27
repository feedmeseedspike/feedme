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

export interface PrizeReminderEmailProps {
  customerName: string;
  prizeName: string;
  expiryDate: string;
  actionUrl: string;
  isVoucher?: boolean;
  voucherCode?: string;
}

export function PrizeReminderEmail({
  customerName,
  prizeName,
  expiryDate,
  actionUrl,
  isVoucher = false,
  voucherCode,
}: PrizeReminderEmailProps) {
  const previewText = `Don't let your free prize expire! 🎁`;
  
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
                alt="FeedMe Logo"
                className="my-0 mx-auto"
              />
            </Section>
            
            <Section className="text-center mt-[32px] mb-[32px]">
              <Text className="text-[#1B6013] text-[24px] font-bold leading-[32px]">
                Time is running out! ⏳
              </Text>
              <Text className="text-black text-[16px] leading-[24px]">
                Hi {customerName},
              </Text>
              <Text className="text-black text-[16px] leading-[24px]">
                Your free prize <strong>&quot;{prizeName}&quot;</strong> is waiting for you, but it expires on <strong>{expiryDate}</strong>.
              </Text>
            </Section>

            {isVoucher && voucherCode && (
              <Section className="bg-[#f6fcf6] border border-solid border-[#1B601320] rounded-[8px] p-[20px] text-center mb-[24px]">
                <Text className="text-[14px] text-[#1B6013] uppercase font-bold tracking-[1px] mb-[8px]">
                  Your Voucher Code
                </Text>
                <Text className="text-[28px] font-bold text-[#1B6013] my-0">
                  {voucherCode}
                </Text>
              </Section>
            )}

            {!isVoucher && (
              <Section className="bg-[#f6fcf6] border border-solid border-[#1B601320] rounded-[8px] p-[20px] text-center mb-[24px]">
                <Text className="text-[16px] text-black leading-[24px]">
                  The <strong>{prizeName}</strong> is already in your cart. Just complete your checkout to claim it!
                </Text>
              </Section>
            )}

            <Section className="text-center mb-[32px]">
              <Button
                className="bg-[#1B6013] rounded text-white text-[16px] font-semibold no-underline text-center px-10 py-4"
                href={actionUrl}
              >
                {isVoucher ? "Claim My Discount" : "Go to Cart"}
              </Button>
            </Section>

            <Text className="text-[#666666] text-[12px] leading-[20px] text-center">
              Detailed terms apply. This prize was awarded based on your recent activity on FeedMe.
            </Text>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#888888] text-[12px] leading-[18px] text-center">
              Thank you for choosing <strong>FeedMe</strong>. We pride ourselves on delivering the freshest produce straight to your home.
            </Text>
            
            <Section className="mt-[32px] text-center">
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="auto"
                height="15"
                alt="FeedMe"
                className="my-0 mx-auto"
              />
              <Text className="text-[#888888] text-[10px] mt-2">
                © {new Date().getFullYear()} FeedMe Africa. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PrizeReminderEmail;
