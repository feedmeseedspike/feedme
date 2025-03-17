import { Separator } from '@components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Image } from 'lucide-react';

const OrderConfirmation = () => {
  const orderDetails = [
    { product: 'Wooden Sofa Chair', color: 'Grey', price: '$320.00' },
    { product: 'Red Gaming Chair', color: 'Black', price: '$180.00' },
    { product: 'Swivel Chair', color: 'Light Brown', price: '$80.00' },
    { product: 'Circular Sofa Chair', color: 'Brown', price: '$180.00' },
  ];

  const summary = [
    { label: 'Shipping', value: '$100.00' },
    { label: 'Taxes', value: '$80.00' },
    { label: 'Coupon Discount', value: '$180.00' },
    // { label: 'Total', value: '$640.00' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="grid justify-center items-center">
      <img src="/order-confirmation.gif" alt="Order Confirmation" className="mx-auto mb-4" style={{ width: '150px', height: '150px' }} />
        <h1 className="text-2xl md:text-3xl font-bold md:mb-2 text-center">Your order is completed!</h1>
        <p className="mb-8 text-sm text-gray-500 text-center">Thank you. Your Order has been received.</p>
      </div>

      <div className="grid grid-cols-4 bg-[#1B6013] w-full rounded-md px-6 py-4">
        <div className="grid gap-2">
          <p className="font-semibold text-xs md:text-sm text-gray-300">Order ID </p>
          <p className="">#123456</p>
        </div>
        <div className="grid gap-2">
          <p className="font-semibold text-xs md:text-sm  text-gray-300">Payment Method </p>
          <p className="">#123456</p>
        </div>
        <div className="grid gap-2">
          <p className="font-semibold text-xs md:text-sm  text-gray-300">Transaction ID </p>
          <p className="">#123456</p>
        </div>
        <div className="grid gap-2">
          <p className="font-semibold text-xs md:text-sm  text-gray-300">Order ID </p>
          <p className="">#123456</p>
        </div>
      </div>

      <div className="grid gap-2 px-4 pb-4 border shadow-sm mt-6 rounded-md">
        <div>
          <h2 className="text-md font-semibold py-4">Order Details</h2>
          <Separator className='' />
          <Table className='border-none'>
            <TableHeader>
              <TableRow className='text-base border-b-0'> 
                <TableHead className='font-semibold'>Products</TableHead>
                <TableHead className='flex justify-end items-center font-bold'>Sub Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderDetails.map((item, index) => (
                <TableRow key={index} className='border-b-0'> 
                  <TableCell className='border-b-0'>{item.product}</TableCell>
                  <TableCell className='flex justify-end border-b-0'>{item.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <Separator className='my-4' />
          <div className="space-y-2">
            {summary.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          <Separator className='my-2' />
            <div  className="flex justify-between ">
                <span>Total</span>
                <span>#3000</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );

};
export default OrderConfirmation;