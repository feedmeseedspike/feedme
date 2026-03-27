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
  Row,
  Column,
} from "@react-email/components";

export interface CartItemInfo {
  name: string;
  image?: string;
  price: number;
}

export interface CartReminderEmailProps {
  customerName: string;
  stage: 1 | 2 | 3;
  isFirstOrder?: boolean;
  ctaUrl: string;
  items?: CartItemInfo[];
  suggestions?: CartItemInfo[];
}

export function CartReminderEmail({
  customerName,
  stage,
  isFirstOrder = false,
  ctaUrl,
  items = [],
  suggestions = [],
}: CartReminderEmailProps) {
  
  const stageInfo = {
    1: {
      headline: "Don't Miss Out! 🏃‍♂️",
      offer: isFirstOrder ? "Save 5% now" : "Fresh items waiting",
      title: "Complete your order",
      preview: "We've saved your fresh ingredients – complete your order now!",
      body: `This is your chance to secure the freshest items for your kitchen. Fast delivery, right to your door. Don't wait—complete your order now before items run out.`,
      ctaText: isFirstOrder ? "Redeem 5% Now" : "Shop My Cart",
    },
    2: {
      headline: "Still Interested? 🌿",
      offer: "Spin & Win awaiting",
      title: "Claim your special prize",
      preview: "Don't forget! Every order wins a prize on our Spin & Win wheel.",
      body: `Our inventory rotates daily for maximum freshness. Secure your favorites now and get your guaranteed prize at checkout.`,
      ctaText: "Claim My Prize Now",
    },
    3: {
      headline: "Final Warning! 🕛",
      offer: "Free Item expiring",
      title: "Claim your prize or lose it",
      preview: "Final hours to secure your free prize item before it expires.",
      body: `This is your final notice. Your free gift or prize item in your cart is about to expire. We'd love for you to have it, so complete your order now before time runs out.`,
      ctaText: "Claim My Free Prize Now",
    }
  };

  const current = stageInfo[stage];
  
  return (
    <Html>
      <Head />
      <Preview>{current.preview}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="mx-auto w-[600px] bg-white">
            
            <Section className="bg-[#FAF6F0] p-[40px] text-center rounded-b-[40px]">
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="140"
                alt="FeedMe"
                className="mx-auto mb-10"
              />
              <Text className="text-[#1B6013] opacity-80 uppercase tracking-[2px] text-[12px] font-bold m-0 mb-4 px-10">
                {current.headline}
              </Text>
              <Text className="text-[#1B6013] text-[34px] font-bold leading-[42px] m-0 mb-6">
                {current.offer}: {current.title}
              </Text>
              <Text className="text-[#333] text-[18px] leading-[28px] m-0 mb-10 max-w-[450px] mx-auto">
                {current.body}
              </Text>
              <Button
                className="bg-[#1B6013] rounded-full text-white text-[18px] font-bold no-underline text-center px-14 py-5 shadow-sm"
                href={ctaUrl}
              >
                {current.ctaText}
              </Button>
            </Section>

            <Section className="py-16 text-center">
              <Text className="text-[#1B6013] text-[28px] font-bold m-0 uppercase tracking-[1px]">
                {items.length > 0 ? "In your cart" : "Popular fresh picks"}
              </Text>
            </Section>

            <Section className="px-[20px]">
              <Row>
                {(items.length > 0 ? items : suggestions).map((item, i) => (
                  <Column key={i} className="px-[10px] w-1/2 align-top pb-10 text-center">
                    <div className="flex flex-col h-full bg-white border border-solid border-[#f0f0f0] p-6 rounded-3xl group">
                      <div className="h-[140px] flex items-center justify-center mb-6">
                        {item.image && (
                          <Img src={item.image} width="140" height="auto" className="object-contain" />
                        )}
                      </div>
                      <Text className="font-bold text-[15px] text-[#333] mb-1 leading-[20px] h-[40px] overflow-hidden">
                        {item.name}
                      </Text>
                      <Text className="font-bold text-[14px] text-[#1B6013] mb-6">
                        {item.price === 0 ? "FREE PRIZE" : `₦${item.price.toLocaleString()}`}
                      </Text>
                      <Button
                        href={ctaUrl}
                        className="bg-white border-2 border-solid border-[#1B6013] text-[#1B6013] text-[14px] font-bold px-8 py-3 rounded-full"
                      >
                        Shop now
                      </Button>
                    </div>
                  </Column>
                ))}
              </Row>
            </Section>

            <Section className="bg-[#1B6013] p-[40px] text-center text-white mt-10 rounded-t-[40px]">
              <Text className="text-[20px] font-bold mb-4">Why choose FeedMe Africa?</Text>
              <Row className="mx-auto w-fit">
                <Column className="px-4 border-r border-solid border-[#ffffff30]">
                  <Text className="text-[12px] font-bold m-0 opacity-80 uppercase">Farm Source</Text>
                </Column>
                <Column className="px-4 border-r border-solid border-[#ffffff30]">
                  <Text className="text-[12px] font-bold m-0 opacity-80 uppercase">3-Hour Delivery</Text>
                </Column>
                <Column className="px-4">
                  <Text className="text-[12px] font-bold m-0 opacity-80 uppercase">Guaranteed Win</Text>
                </Column>
              </Row>
            </Section>

            <Section className="bg-[#F6F6F6] p-[60px] text-center">
              <Text className="text-[#666] text-[13px] leading-[22px] mb-10 max-w-[400px] mx-auto">
                Questions? Our support team is here for you.<br />
                <a href="https://wa.me/2348088282487" className="text-[#1B6013] font-bold no-underline">WhatsApp Support</a>
              </Text>

              <Hr className="border-[#ddd] mb-10" />
              
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="60"
                alt="FeedMe"
                className="mx-auto mb-6 opacity-30 grayscale"
              />
              <Text className="text-[#999] text-[11px] leading-[16px] m-0 max-w-[500px] mx-auto italic">
                The free prize item is valid for 14 days from issue date. 
                You received this because you have an account or cart with FeedMe Africa.<br />
                © {new Date().getFullYear()} FeedMe Africa. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default CartReminderEmail;
