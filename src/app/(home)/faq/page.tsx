import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import * as motion from "framer-motion/client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | FeedMe Lagos",
  description: "Find answers to common questions about FeedMe Lagos grocery delivery, delivery times, operating hours, and more. Fast fresh food delivery in Lagos.",
  keywords: "FeedMe Lagos FAQ, fresh food delivery Lagos, online grocery Lagos, same day delivery Lagos, FeedMe support",
};

const faqs = [
  {
    question: "What is FeedMe Lagos?",
    answer: "FeedMe is a specialised online grocery and fresh food delivery service in Lagos, Nigeria, focused on providing high-quality farm produce, meats, and pantry essentials directly to your doorstep.",
  },
  {
    question: "How fast does FeedMe deliver fresh groceries in Lagos?",
    answer: "FeedMe delivers fresh farm produce to your doorstep in 3 hours or less across Lagos. Except areas like Badagry, Mowe, and Epe. FeedMe's rapid delivery network ensures your fruits, vegetables, tubers, and pantry staples arrive fresh — the same day you order.",
  },
  {
    question: "What are the operating hours for same-day delivery?",
    answer: "To qualify for same-day delivery, orders are typically made between 8:00 AM and 6:00 PM. Orders placed after 6:00 PM are generally scheduled for next-day delivery.",
  },
  {
    question: "What types of food can I order on FeedMe?",
    answer: "FeedMe offers a wide range of fresh, farm-sourced products, including fruits, vegetables, tubers, peppers, oils, sauces, and spices. All produce is sourced directly from farms to ensure quality and freshness. You can shop for everyday cooking ingredients and staples through the website at shopfeedme.com.",
  },
  {
    question: "Which areas in Lagos does FeedMe deliver to?",
    answer: "FeedMe currently delivers to multiple neighbourhoods across Lagos except Badagry, Mowe, and Epe. The platform is built specifically for Lagos residents who want fast access to fresh, authentic farm produce without visiting a market.",
  },
  {
    question: "How do I order fresh groceries from FeedMe?",
    answer: "Ordering from FeedMe is simple: visit shopfeedme.com, browse the available produce categories, add items to your cart, and check out. FeedMe handles the rest — picking, packing, and delivering your order within 3 hours. No market trips, no haggling, no hassle.",
  },
  {
    question: "Does FeedMe have a return or refund policy?",
    answer: "Yes, FeedMe offers refunds for valid complaints. To qualify, you must notify customer support within 24 hours of receiving your order and provide proof, such as photos or videos of the issue.",
  },
  {
    question: "Are the payments on the FeedMe website secure?",
    answer: "Yes, the platform uses a secure online payment system to ensure that your financial data is protected during every transaction.",
  },
  {
    question: "Can I return perishable items if I change my mind?",
    answer: "Perishable goods like fresh produce and meat cannot be returned or refunded unless they are defective or damaged upon arrival.",
  },
  {
    question: "Does FeedMe offer cash on delivery in Lagos?",
    answer: "Yes, FeedMe supports cash on delivery as a payment option, making it accessible even to customers who prefer not to pay online. This is especially convenient for first-time customers who want to verify the quality of their produce before completing payment.",
  },
  {
    question: "How can I contact FeedMe customer support?",
    answer: "You can reach out via phone support or WhatsApp. They offer 24/7 assistance through WhatsApp for quick updates and order inquiries.",
  },
  {
    question: "What is the Seedspike/FeedMe Wallet?",
    answer: "The wallet is an internal credit system used for faster refunds and easier checkout on future orders without needing to input card details every time.",
  },
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-white py-4">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>
      <Container className="pb-24 mt-8">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Frequently Asked <span className="text-[#1B6013]">Questions</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about FeedMe Lagos. Can&apos;t find the answer you&apos;re looking for? 
              Reach out to our support team.
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="border rounded-2xl px-6 py-1 bg-white hover:border-[#1B6013]/30 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg hover:no-underline hover:text-[#1B6013] transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-6 text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20 p-10 bg-[#1B6013]/5 rounded-[2.5rem] text-center border border-[#1B6013]/10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#1B6013]/10 rounded-full blur-3xl group-hover:bg-[#1B6013]/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#1B6013]/10 rounded-full blur-3xl group-hover:bg-[#1B6013]/20 transition-all duration-500"></div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Still have questions?</h3>
            <p className="text-gray-600 mb-8 relative z-10">
              We&apos;re here to help you get the best fresh groceries in Lagos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <a 
                href="https://wa.me/2349044444214" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#1B6013] text-white font-bold rounded-2xl hover:bg-[#154a0f] transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-[#1B6013]/20"
              >
                Chat on WhatsApp
              </a>
              <a 
                href="tel:+2349044444214"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1B6013] font-bold rounded-2xl border-2 border-[#1B6013] hover:bg-[#1B6013]/5 transition-all duration-300 transform hover:-translate-y-1"
              >
                Call Support
              </a>
            </div>
          </motion.div>
        </div>
      </Container>
    </>
  );
}
