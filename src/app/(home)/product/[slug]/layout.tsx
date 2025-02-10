

import Header from "@components/shared/header"
import BreadCrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";


export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col '>
      {/* <Header /> */}
      <div className="bg-white">
        <Container className="py-4">
          <BreadCrumb  
            />
        </Container>
      </div>

      <main className=''>{children}</main>
      {/* <Footer /> */}
    </div>
  )
}
