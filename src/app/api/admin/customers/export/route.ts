
import { NextRequest, NextResponse } from "next/server";
import { fetchCustomers } from "src/queries/customers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Fetch ALL customers matching the criteria
    // We use a high itemsPerPage to get everything (within reason).
    // If you have massive data, efficient streaming or batching would be better,
    // but for now this is a robust improvement over client-side current page only.
    const { data: customers } = await fetchCustomers({
      page: 1,
      itemsPerPage: 100000, 
      search,
      role,
      status,
      startDate,
      endDate,
    });

    if (!customers || customers.length === 0) {
      return new NextResponse("No customers found", { status: 404 });
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "City",
      "Total Orders",
      "Total Spent",
      "Role",
      "Joined At"
    ];

    const csvContent = [
      headers.join(","),
      ...customers.map(c => {
         const phone = c.addresses && c.addresses.length > 0 ? c.addresses[0].phone : "";
         const city = c.addresses && c.addresses.length > 0 ? c.addresses[0].city : "";
         
         const cleanString = (str: string | null | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
         
         return [
           (c as any).id,
           cleanString(c.display_name),
           cleanString(c.email),
           cleanString(phone),
           cleanString(city),
           c.totalOrders,
           c.totalAmountSpent,
           c.is_staff ? "Staff" : (c.role || "Buyer"),
           c.created_at
         ].join(",");
      })
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
