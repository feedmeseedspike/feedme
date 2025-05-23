import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import Link from "next/link";

export default function ReturnRefundPolicy() {
  return (
    <>
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
    <Container className="">
      <div className="">
        {/* Header */}
        <div className=" text-black">
          <h1 className="text-3xl font-bold">Return & Refund Policy</h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <section className="space-y-4">
            <p className="text-gray-700">
              Thank you for choosing <span className="font-semibold text-[#1B6013]">FeedMe</span>! We strive to ensure you are completely satisfied with your purchases. If you are not happy with your order, we offer refunds for valid complaints made within <span className="font-bold">24 hours</span> of delivery.
            </p>
          </section>

          {/* Eligibility Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
              Eligibility for Refunds & Returns
            </h2>
            <p className="text-gray-700">
              To qualify for a refund or return:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>You must notify us within <strong>24 hours</strong> of receiving your order.</li>
              <li>Provide proof (photo/video) of the issue (e.g., damaged or incorrect item).</li>
              <li>The product must be unused and in its original packaging.</li>
            </ul>
          </section>

          {/* Non-Refundable Items */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Non-Refundable Items
            </h3>
            <p className="text-gray-700">
              The following items <strong>cannot</strong> be returned or refunded unless defective:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Perishable goods (e.g., fresh produce, seeds with short shelf life).</li>
              <li>Digital products or services.</li>
              <li>Custom-made or personalized items.</li>
            </ul>
          </section>

          {/* Refund Process */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
              Refund Process
            </h2>
            <ol className="list-decimal pl-5 space-y-3 text-gray-700">
              <li>
                <strong>Request a Return</strong> – Contact us at{" "}
                <Link href="mailto:seedspiketeam@gmail.com" className="text-[#1B6013] hover:underline">
                  seedspiketeam@gmail.com
                </Link>{" "}
                or call <strong>+234 (0) 904 444 4214</strong> within 24 hours of delivery.
              </li>
              <li>
                <strong>Submit Evidence</strong> – Share photos/videos of the issue for verification.
              </li>
              <li>
                <strong>Approval & Return</strong> – If approved, we will provide return instructions.
              </li>
              <li>
                <strong>Refund Method</strong> – Refunds will be issued via:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <strong>Seedspike Wallet Credit</strong> (for orders below ₦5,000).
                  </li>
                  <li>
                    <strong>Bank Transfer</strong> (for orders above ₦5,000; processed within{" "}
                    <strong>3–5 business days</strong>).
                  </li>
                </ul>
              </li>
            </ol>
          </section>

          {/* Exceptions */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
              Exceptions
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                Refunds may take longer during holidays or banking delays.
              </li>
              <li>
                Return shipping costs are covered by <strong>Seedspike</strong> for defective/wrong items. If you change your mind, you bear return costs.
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
              Contact Us
            </h2>
            <p className="text-gray-700">
              For questions or assistance, reach out via:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <strong>Email:</strong>{" "}
                <Link href="mailto:seedspiketeam@gmail.com" className="text-green-600 hover:underline">
                  seedspiketeam@gmail.com
                </Link>
              </li>
              <li>
                <strong>Phone:</strong> +234 (0) 904 444 4214
              </li>
              <li>
                <strong>Offices:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <strong>Lagos:</strong> 38 Duro Oyedoyin, Surulere.
                  </li>
                  <li>
                    <strong>Ibadan:</strong> 10 Idera Estate, Elega, Akobo.
                  </li>
                  <li>
                    <strong>Abuja:</strong> Millennium Building, Opposite NNPC Towers, Central Area.
                  </li>
                </ul>
              </li>
            </ul>
            <p className="italic text-gray-500 mt-4">
              Note: All refunds are evaluated case-by-case based on product availability and valid reasons.
            </p>
          </section>
        </div>
      </div>
    </Container>
    </>
  );
}