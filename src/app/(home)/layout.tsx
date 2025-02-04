import Footer from "@components/shared/footer"
import Header from "@components/shared/header"


export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col '>
      <Header />
      <main className='bg-[#F9FAFB] min-h-screen'>{children}</main>
      <Footer />
    </div>
  )
}
