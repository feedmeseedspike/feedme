



export default async function checkoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col '>
      <main className=''>{children}</main>
    </div>
  )
}
