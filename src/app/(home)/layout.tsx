import Headertags from "@/components/shared/header/Headertags";
import Footer from "@components/shared/footer";
import Header from "@components/shared/header";
import AnnouncementBanner from "@/components/shared/announcement-banner";
import FloatingSpinWidget from "@/components/shared/FloatingSpinWidget";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col ">
      {/* <div className="mb-[5rem]">
      </div> */}
      <AnnouncementBanner />
      <Header />
      <Headertags />
      <main className="bg-[#F9FAFB] min-h-screen pb-20">{children}</main>
      <Footer />
      <FloatingSpinWidget />
    </div>
  );
}
