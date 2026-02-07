// app/api/recipes/[id]/comments/[commentId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { commentId } = params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const guestId = user ? null : req.headers.get('x-forwarded-for') || 'guest';

    // Check if already liked
    const { data: existing } = await supabase
      .from('recipe_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq(user ? 'user_id' : 'guest_id', user?.id || guestId)
      .single();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('recipe_comment_likes')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      return NextResponse.json({ success: true, action: 'unliked' });
    } else {
      // Like
      const { error } = await supabase
        .from('recipe_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user?.id || null,
          guest_id: guestId,
        });

      if (error) throw error;

      return NextResponse.json({ success: true, action: 'liked' });
    }
  } catch (error: any) {
    console.error('Like API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
