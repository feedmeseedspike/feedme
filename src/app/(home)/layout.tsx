import Headertags from "@/components/shared/header/Headertags";
import Footer from "@components/shared/footer";
import Header from "@components/shared/header";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col ">
      {/* <div className="mb-[5rem]">
      </div> */}
      <Header />
      <div className="hidden md:block border-b py-2">
        <Headertags />
      </div>
      <main className="bg-[#F9FAFB] min-h-screen pb-20">{children}</main>
      <Footer />
    </div>
  );
}
