"use client";

import Image from "next/image";
import Container from "@components/shared/Container";

const trustBadges = [
  {
    name: "NAFDAC",
    logo: "/images/NAFDAC.svg",
    label: "Food Safety & Compliance",
  },
  {
    name: "Standards Organisation of Nigeria",
    logo: "/images/SON.png",
    label: "Quality Assurance",
  },
  {
    name: "Paystack",
    logo: "/images/paystack.svg",
    label: "Secure Transactions",
  },
  {
    name: "Insured Deliveries",
    logo: "/images/delivery-insurance.png",
    label: "Trusted logistics partners",
  },
];

const TrustFooterHighlight = () => {
  return (
    <section className=" text-white py-8 md:py-12">
      <Container>
        <div className="rounded-[28px] md:rounded-[32px] bg-gradient-to-br from-[#0F2E0B] via-[#134012] to-[#051906] p-6 md:p-12 flex flex-col lg:flex-row gap-6 md:gap-10 items-center">
          <div className="lg:w-1/3 space-y-2.5 md:space-y-3 text-center lg:text-left">
            <p className="text-sm uppercase tracking-[0.4em] text-[#F2C94C]">
              Trusted & Certified
            </p>
            <h3 className="text-2xl font-semibold">
              Backed by regulators and secure payment partners.
            </h3>
            <p className="text-sm text-white/85">
              Certifications that keep your pantry safe and your transactions
              protected.
            </p>
          </div>
          <div className="lg:flex-1 grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 w-full">
            {trustBadges.map((badge) => (
              <div
                key={badge.name}
                className="bg-white/10 border border-white/15 rounded-2xl px-3 py-4 sm:px-4 sm:py-6 flex flex-col items-center text-center gap-2.5 sm:gap-3 backdrop-blur-sm"
              >
                <div className="relative h-14 w-16 sm:h-16 sm:w-20">
                  <Image
                    src={badge.logo}
                    alt={`${badge.name} badge`}
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                </div>
                <p className="text-base font-semibold">{badge.name}</p>
                <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-[0.25em]">
                  {badge.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TrustFooterHighlight;
