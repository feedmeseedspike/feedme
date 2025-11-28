"use client";

import Image from "next/image";
import Container from "@components/shared/Container";

const partners = [
  {
    name: "FATE Foundation",
    description: "Supporting farmer communities with business acceleration.",
    logo: "/partnerships/FATE-Foundation-Logo.png",
  },
  {
    name: "Netherlands Enterprise",
    description: "Driving sustainable agriculture with international grants.",
    logo: "/partnerships/Logo-Kingdom-of-the-Netherlands.png",
  },
  {
    name: "Orange Corners",
    description: "Innovation programs that keep our supply chain nimble.",
    logo: "/partnerships/orange_corner.png",
  },
  {
    name: "Stanbic IBTC",
    description: "Secure payment and growth financing for our vendors.",
    logo: "/partnerships/stanbic-ibtc-bank-seeklogo.png",
  },
];

const Partnerships = () => {
  return (
    <section className="py-16 ">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.5em] text-[#1B6013]">
            Partnerships
          </p>
          {/* <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
            Scaling fresh food access with trusted allies
          </h2>
          <p className="text-base md:text-lg text-[#475467]">
            We collaborate with development partners, financial institutions, and
            regulators so every order is safe, transparent, and delivered with
            confidence.
          </p> */}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex flex-col justify-center items-center gap-4 h-full"
            >
              <div className="relative h-16 w-32">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              </div>
              {/* <h3 className="text-lg font-semibold text-[#101828]">
                {partner.name}
              </h3>
              <p className="text-sm text-[#475467] flex-1">{partner.description}</p> */}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Partnerships;

