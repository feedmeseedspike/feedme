import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: offers, error } = await supabase
      .from('offers')
      .select(`
        *,
        categories(
          id,
          title
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching offers:', error);
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error in GET /api/offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      title,
      description,
      image_url,
      price_per_slot,
      total_slots,
      available_slots,
      weight_per_slot,
      end_date,
      category_id
    } = body;

    // Validate required fields
    if (!title || !price_per_slot || !total_slots) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price_per_slot, total_slots' },
        { status: 400 }
      );
    }

    const { data: offer, error } = await supabase
      .from('offers')
      .insert([
        {
          title,
          description,
          image_url,
          price_per_slot: parseFloat(price_per_slot),
          total_slots: parseInt(total_slots),
          available_slots: available_slots || parseInt(total_slots), // Use provided or default to total_slots
          weight_per_slot,
          end_date,
          category_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating offer:', error);
      return NextResponse.json({ 
        error: 'Failed to create offer', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}