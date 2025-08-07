import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: offer, error } = await supabase
      .from('offers')
      .select(`
        *,
        categories(
          id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching offer:', error);
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error in GET /api/offers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    const { data: offer, error } = await supabase
      .from('offers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating offer:', error);
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error in PUT /api/offers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting offer:', error);
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/offers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}