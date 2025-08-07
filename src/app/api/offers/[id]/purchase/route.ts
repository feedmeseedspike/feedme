import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: offerId } = params;
    const body = await request.json();

    const {
      slots_purchased,
      phone,
      email,
      delivery_address,
      payment_method = 'bank_transfer'
    } = body;

    // Validate required fields
    if (!slots_purchased || !phone || !email || !delivery_address) {
      return NextResponse.json(
        { error: 'Missing required fields: slots_purchased, phone, email, delivery_address' },
        { status: 400 }
      );
    }

    // Start transaction-like operation
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if offer is active and has enough slots
    if (offer.status !== 'active') {
      return NextResponse.json({ error: 'Offer is no longer active' }, { status: 400 });
    }

    if (offer.available_slots < parseInt(slots_purchased)) {
      return NextResponse.json({ 
        error: `Only ${offer.available_slots} slots available` 
      }, { status: 400 });
    }

    // Check if offer has expired
    if (offer.end_date && new Date(offer.end_date) < new Date()) {
      return NextResponse.json({ error: 'Offer has expired' }, { status: 400 });
    }

    const totalAmount = offer.price_per_slot * parseInt(slots_purchased);

    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('offer_purchases')
      .insert([
        {
          offer_id: offerId,
          user_id: user?.id || null,
          slots_purchased: parseInt(slots_purchased),
          total_amount: totalAmount,
          phone,
          email,
          delivery_address,
          payment_method,
          status: 'pending' // Will be confirmed after payment
        }
      ])
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
    }

    // Update available slots
    const newAvailableSlots = offer.available_slots - parseInt(slots_purchased);
    const newStatus = newAvailableSlots === 0 ? 'sold_out' : offer.status;

    const { error: updateError } = await supabase
      .from('offers')
      .update({
        available_slots: newAvailableSlots,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Error updating offer slots:', updateError);
      // You might want to rollback the purchase here in a real transaction
      return NextResponse.json({ error: 'Failed to update offer availability' }, { status: 500 });
    }

    return NextResponse.json({ 
      purchase,
      message: 'Purchase created successfully. Please proceed with payment.',
      total_amount: totalAmount
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/offers/[id]/purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}