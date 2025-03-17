import { notFound } from "next/navigation";
import Image from "next/image";

// Dummy data for customers
const customers = [
  {
    id: 1,
    name: "John Doe",
    phoneNumber: "+234 812 345 6789",
    email: "johndoe@example.com",
    totalAmountSpent: 50000,
    totalOrders: 10,
    location: "Ikeja, Lagos",
    image: "/images/customer1.jpg",
    orders: [
      {
        orderNo: "#0001",
        date: "Nov 11 at 7:56pm",
        amount: "N5,000.00",
        platform: "WhatsApp",
        address: "17, ABC Street, Ikeja, Lagos",
        progress: "Out for Delivery",
      },
      {
        orderNo: "#0002",
        date: "Nov 10 at 5:30pm",
        amount: "N3,000.00",
        platform: "Mobile App",
        address: "17, ABC Street, Ikeja, Lagos",
        progress: "Processing order",
      },
    ],
  },
  {
    id: 2,
    name: "Jane Smith",
    phoneNumber: "+234 812 345 6789",
    email: "janesmith@example.com",
    totalAmountSpent: 75000,
    totalOrders: 15,
    location: "Victoria Island, Lagos",
    image: "/images/customer2.jpg",
    orders: [
      {
        orderNo: "#0003",
        date: "Nov 9 at 8:00pm",
        amount: "N7,000.00",
        platform: "Website",
        address: "12, XYZ Street, Victoria Island, Lagos",
        progress: "Order Continued",
      },
    ],
  },
];

export default function CustomerPage({ params }: { params: { id: string } }) {
  console.log(params.id);
  const customer = customers.find((customer) => customer.id === Number(params.id));

  if (!customer) {
    notFound();
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">{customer.name}</h2>
          <p className="text-[#475467]">View customer details and orders.</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <Image
            src={customer.image}
            alt={customer.name}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <p className="text-lg font-semibold">{customer.name}</p>
            <p className="text-gray-600">{customer.email}</p>
            <p className="text-gray-600">{customer.phoneNumber}</p>
            <p className="text-gray-600">{customer.location}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Order No</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Platform</th>
                <th className="px-4 py-2 text-left">Address</th>
                <th className="px-4 py-2 text-left">Progress</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{order.orderNo}</td>
                  <td className="px-4 py-2">{order.date}</td>
                  <td className="px-4 py-2">{order.amount}</td>
                  <td className="px-4 py-2">{order.platform}</td>
                  <td className="px-4 py-2">{order.address}</td>
                  <td className="px-4 py-2">{order.progress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button className="text-gray-500 hover:text-gray-700">Previous</button>
          <span>Page 1 of 10</span>
          <button className="text-gray-500 hover:text-gray-700">Next</button>
        </div>
      </div>
    </div>
  );
}