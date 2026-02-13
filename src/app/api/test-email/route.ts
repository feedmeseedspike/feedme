import { NextResponse } from "next/server";
import { sendOrderConfirmationEmails } from "@/utils/email/sendOrderEmail";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const testOrderReference = `ORD-${Math.floor(Math.random() * 1000000)}`;
    
    // Simulate a realistic order structure
    const sampleItems = [
      { 
        title: "Smoked Turkey Wings", 
        quantity: 2, 
        price: 4500,
        optionName: "Spicy Glazed",
        customizations: {
            "Extra_Sauce": "Yes",
            "Spice_Level": "Medium"
        }
      },
      { 
        title: "Jollof Rice Jumbo Pack", 
        quantity: 1, 
        price: 12000,
        // No options/customizations for this one implies standard
      },
      {
        title: "Fresh Farm Eggs (Crate)",
        quantity: 1,
        price: 3500
      }
    ];

    const subtotal = 4500 * 2 + 12000 + 3500; // 24500
    const deliveryFee = 1500;
    const discount = 0;
    const totalPaid = subtotal + deliveryFee - discount;

    await sendOrderConfirmationEmails({
      adminEmail: "orders.feedmeafrica@gmail.com",
      userEmail: "orders.feedmeafrica@gmail.com", 
      adminOrderProps: {
        orderNumber: testOrderReference,
        customerName: "Jeremiah Test-User",
        customerPhone: "08012345678",
        itemsOrdered: sampleItems,
        deliveryAddress: "Block 4, Flat 2, Banana Island, Ikoyi, Lagos",
        localGovernment: "Eti-Osa",
        discount: discount,
        totalAmount: totalPaid,
      },
      userOrderProps: {
        orderNumber: testOrderReference,
        customerName: "Jeremiah Test-User",
        customerPhone: "08012345678",
        itemsOrdered: sampleItems,
        deliveryAddress: "Block 4, Flat 2, Banana Island, Ikoyi, Lagos",
        deliveryFee: deliveryFee,
        serviceCharge: 0,
        totalAmount: subtotal,
        totalAmountPaid: totalPaid,
        discount: discount,
        userid: "test-user-uuid-12345",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test emails sent to orders.feedmeafrica@gmail.com. Please check your inbox (and spam)." 
    });
  } catch (error: any) {
    console.error("Test email failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
