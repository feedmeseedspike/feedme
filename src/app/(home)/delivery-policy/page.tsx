import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import Link from "next/link";
import { Truck, Clock, ShieldCheck, RotateCcw } from "lucide-react";

export const metadata = {
  title: "Delivery Policy | FeedMe",
  description:
    "Learn about FeedMe's delivery policy — fast 3-hour delivery across Lagos, service areas, shipping fees, and our returns & refunds process.",
  alternates: {
    canonical: "https://shopfeedme.com/delivery-policy",
  },
  openGraph: {
    title: "Delivery Policy | FeedMe",
    description:
      "Learn about FeedMe's delivery policy — fast 3-hour delivery across Lagos, service areas, shipping fees, and our returns & refunds process.",
    url: "https://shopfeedme.com/delivery-policy",
    images: "/opengraph-image.jpg",
  },
};

export default function DeliveryPolicyPage() {
  return (
    <>
      <div className="bg-white py-4">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>

      <Container>
        <div className="max-w-3xl mx-auto py-8 space-y-10">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Delivery Policy
            </h1>
            <p className="text-gray-500 text-base">
              Everything you need to know about how{" "}
              <span className="font-semibold text-[#1B6013]">FeedMe</span>{" "}
              delivers fresh produce to your doorstep.
            </p>
          </div>

          {/* Fast Delivery */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B6013]/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#1B6013]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex-1">
                Fast &amp; Secure Delivery
              </h2>
            </div>
            <p className="text-gray-700">
              Get your fresh food delivered to your doorstep in under{" "}
              <span className="font-bold">3 hours</span> anywhere in Lagos,
              including Victoria Island, Lekki, Surulere, Ikeja, and
              surrounding areas.
            </p>
            <p className="text-gray-700">
              Our delivery partners are trained to handle perishable goods with
              care, using insulated packaging to maintain freshness from farm to
              your door.
            </p>
          </section>

          {/* Delivery Hours */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B6013]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#1B6013]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex-1">
                Delivery Hours &amp; Areas
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-semibold">Operating hours:</span> Monday –
                Saturday, 7:00 AM – 7:00 PM
              </li>
              <li>
                <span className="font-semibold">Delivery window:</span> Within 3
                hours of order confirmation
              </li>
              <li>
                <span className="font-semibold">Coverage areas:</span> Lagos
                Island, Victoria Island, Lekki, Surulere, Ikeja, Yaba, Ajah,
                and more
              </li>
              <li>
                <span className="font-semibold">Abuja &amp; Ibadan:</span>{" "}
                Available for select orders — please contact us to confirm
                availability in your area
              </li>
            </ul>
            <p className="text-gray-700 text-sm italic">
              Note: Delivery times may vary slightly during public holidays or
              periods of high demand. We will notify you of any delays.
            </p>
          </section>

          {/* Delivery Fees */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B6013]/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#1B6013]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex-1">
                Delivery Fees
              </h2>
            </div>
            <p className="text-gray-700">
              Delivery fees are calculated at checkout based on your location.
              Fees are displayed transparently before you place your order.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-semibold">Free delivery</span> may be
                available on qualifying orders or during promotional periods —
                check the banner on our homepage.
              </li>
              <li>
                Loyalty members and referral reward holders may qualify for{" "}
                <span className="font-semibold">free delivery bonuses</span> on
                their next order.
              </li>
            </ul>
          </section>

          {/* Refunds & Returns */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B6013]/10 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-[#1B6013]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex-1">
                Refunds &amp; Returns Eligibility
              </h2>
            </div>
            <p className="text-gray-700">
              We strive to ensure you are completely satisfied with your
              purchases. If you are not happy with your order, we offer refunds
              for valid complaints made within{" "}
              <span className="font-bold">24 hours</span> of delivery.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-semibold">Perishable goods</span> (e.g.,
                fresh produce, raw meat) cannot be returned unless strictly
                defective.
              </li>
              <li>
                You must provide proof (photo/video) of the issue within 24
                hours of receiving your order.
              </li>
              <li>
                The product must be unused and in its original packaging.
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              For the complete returns process and refund methods, please review
              our{" "}
              <Link
                href="/return-policy"
                className="text-[#F0800F] font-semibold hover:underline"
              >
                Return &amp; Refund Policy
              </Link>
              .
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4 bg-[#F9FAFB] rounded-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Need Help?</h2>
            <p className="text-gray-700">
              If you have questions about your delivery or need to report an
              issue, contact us via:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-semibold">Email:</span>{" "}
                <Link
                  href="mailto:seedspiketeam@gmail.com"
                  className="text-[#1B6013] hover:underline"
                >
                  seedspiketeam@gmail.com
                </Link>
              </li>
              <li>
                <span className="font-semibold">Phone:</span> +234 (0) 904 444
                4214
              </li>
            </ul>
          </section>
        </div>
      </Container>
    </>
  );
}
