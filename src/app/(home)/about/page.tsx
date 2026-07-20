import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | FeedMe",
  description: "Learn more about FeedMe, Nigeria's fresh produce delivery platform, connecting local farmers directly with households and businesses.",
};

export default function AboutPage() {
  return (
    <>
      <div className="bg-white py-4">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>
      <Container className="pb-16 mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              About <span className="text-[#1B6013]">Us</span>
            </h1>
          </div>

          <div className="space-y-16 text-gray-700 leading-relaxed">
            <section className="max-w-3xl mx-auto">
              <div className="space-y-6 text-lg">
                <p>
                  <span className="font-semibold text-[#1B6013]">FeedMe</span> (RC 7883744) is Nigeria&apos;s fresh produce delivery platform, built by Seedspike Technologies in 2024 to close the gap between farmers and consumers.
                </p>
                <p>
                  Based in Lagos, we connect local farmers directly with households and businesses, cutting out the middlemen who drive up prices and squeeze farmers&apos; profits. The result: fresher produce for you, fairer earnings for the farmers who grow it.
                </p>
                <p>
                  Today, FeedMe serves over 2,000 customers across Lagos, with most orders delivered in under 3 hours — making us one of the fastest fresh-food delivery services in Nigeria&apos;s agribusiness space.
                </p>
                <p>
                  With FeedMe, you can shop fresh farm produce at honest prices and have it delivered the same day, straight to your door. Easy, convenient, and hassle-free.
                </p>
              </div>
            </section>

            <section className="mt-16 p-10 bg-[#1B6013]/5 rounded-[2.5rem] border border-[#1B6013]/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#1B6013]/10 rounded-full blur-3xl group-hover:bg-[#1B6013]/20 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#1B6013]/10 rounded-full blur-3xl group-hover:bg-[#1B6013]/20 transition-all duration-500"></div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Contact Us</h2>
              <p className="text-gray-600 mb-8 relative z-10">Have a question, order issue, or partnership idea? We&apos;d love to hear from you.</p>
              
              <ul className="list-none space-y-4 relative z-10">
                <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <strong className="text-gray-900 min-w-[140px]">Email:</strong>
                  <Link href="mailto:seedspiketeam@gmail.com" className="text-[#1B6013] font-semibold hover:underline">
                    seedspiketeam@gmail.com
                  </Link>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <strong className="text-gray-900 min-w-[140px]">Phone / WhatsApp:</strong>
                  <Link href="https://wa.me/2348088282487" target="_blank" rel="noopener noreferrer" className="text-[#1B6013] font-semibold hover:underline">
                    08088282487
                  </Link>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                  <strong className="text-gray-900 min-w-[140px]">Address:</strong>
                  <span className="text-gray-700">38, Duro Oyedoyin street, Surulere</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <strong className="text-gray-900 min-w-[140px]">Hours:</strong>
                  <span className="text-gray-700">Monday–Saturday, 9am–6pm</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
