import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | FeedMe",
  description: "Learn how FeedMe collects, uses, and protects your personal information. Read our privacy policy to understand your rights and our commitment to security.",
};

export default function PrivacyPolicy() {
  return (
    <>
      <div className="bg-white py-4">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>
      <Container className="pb-16">
        <div className="max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500">Last Updated: March 21, 2024</p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">1. Introduction</h2>
              <p>
                Welcome to <span className="font-semibold text-[#1B6013]">FeedMe</span> (operated by Seedspike Africa). Your privacy is of paramount importance to us. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our website and mobile application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">2. Information We Collect</h2>
              <p className="mb-4">We collect information to provide better services to all our users. The types of information we collect include:</p>
              <ul className="list-disc pl-5 space-y-3">
                <li><strong>Personal Identifiable Information:</strong> Name, email address, phone number, and delivery address.</li>
                <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products you have purchased from us.</li>
                <li><strong>Technical Data:</strong> IP address, login data, browser type and version, time zone setting, and location.</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">3. How We Use Your Information</h2>
              <p className="mb-4">We use your information for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-3">
                <li>To process and deliver your orders.</li>
                <li>To manage your account and provide customer support.</li>
                <li>To improve our website, products/services, marketing, and customer relationships.</li>
                <li>To send you promotional communications (only with your consent).</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">4. Data Security</h2>
              <p>
                We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">5. Your Legal Rights</h2>
              <p className="mb-4">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
              <ul className="list-disc pl-5 space-y-3">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>Request erasure of your personal data.</li>
                <li>Object to processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">6. Contact Us</h2>
              <p className="mb-4">If you have any questions about this Privacy Policy or our privacy practices, please contact us at:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Email:</strong> <Link href="mailto:seedspiketeam@gmail.com" className="text-[#1B6013] font-semibold hover:underline">seedspiketeam@gmail.com</Link></li>
                <li><strong>Phone:</strong> +234 (0) 904 444 4214</li>
                <li><strong>Address:</strong> 38 Duro Oyedoyin, Surulere, Lagos, Nigeria.</li>
              </ul>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
