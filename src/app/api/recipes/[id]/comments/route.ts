// app/api/recipes/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { comment_text, parent_comment_id } = await req.json();
    const bundleId = params.id;

    if (!comment_text || comment_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Insert comment
    const { data, error } = await supabase
      .from('recipe_comments')
      .insert({
        bundle_id: bundleId,
        user_id: user?.id || null,
        guest_name: user ? null : 'Guest User',
        comment_text: comment_text.trim(),
        parent_comment_id: parent_comment_id || null,
        is_approved: true, // Auto-approve for now, can add moderation later
      })
      .select()
      .single();

    if (error) {
      console.error('Comment error:', error);
      return NextResponse.json(
        { error: 'Failed to post comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Comment API error:', error);
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
      .from('recipe_comments')
      .select('*')
      .eq('bundle_id', bundleId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch comments error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: data || [] });
  } catch (error: any) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
