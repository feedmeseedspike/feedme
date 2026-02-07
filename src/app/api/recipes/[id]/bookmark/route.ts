// app/api/recipes/[id]/bookmark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to bookmark recipes' },
        { status: 401 }
      );
    }

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('recipe_bookmarks')
      .select('id')
      .eq('bundle_id', bundleId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from('recipe_bookmarks')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add bookmark
      const { error } = await supabase.from('recipe_bookmarks').insert({
        bundle_id: bundleId,
        user_id: user.id,
      });

      if (error) throw error;

      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    console.error('Bookmark API error:', error);
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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isBookmarked: false });
    }

    const { data } = await supabase
      .from('recipe_bookmarks')
      .select('id')
      .eq('bundle_id', bundleId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ isBookmarked: !!data });
  } catch (error: any) {
    console.error('Bookmark check API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
