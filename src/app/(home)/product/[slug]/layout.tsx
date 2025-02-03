

import Header from "@components/shared/header"
import BreadCrumb from "@components/shared/breadcrumb";


export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col '>
      {/* <Header /> */}
      <BreadCrumb />

      <main className=''>{children}</main>
      {/* <Footer /> */}
    </div>
  )
}
