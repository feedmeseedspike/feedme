// app/api/recipes/[id]/rate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { rating, review_text } = await req.json();
    const bundleId = params.id;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Insert or update rating
    const { data, error } = await supabase
      .from('recipe_ratings')
      .upsert(
        {
          bundle_id: bundleId,
          user_id: user?.id || null,
          guest_id: user ? null : req.headers.get('x-forwarded-for') || 'guest',
          rating,
          review_text: review_text || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: user ? 'bundle_id,user_id' : 'bundle_id,guest_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Rating error:', error);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('bundle_id', bundleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch ratings error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ratings: data || [] });
  } catch (error: any) {
    console.error('Ratings API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
