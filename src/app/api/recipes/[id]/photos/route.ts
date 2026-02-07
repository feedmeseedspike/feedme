// app/api/recipes/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id;
    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const caption = formData.get('caption') as string;

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo file is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Upload to Supabase Storage
    const fileExt = photo.name.split('.').pop();
    const fileName = `${bundleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-photos')
      .upload(fileName, photo, {
        contentType: photo.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('recipe-photos').getPublicUrl(fileName);

    // Save to database
    const { data, error } = await supabase
      .from('recipe_user_photos')
      .insert({
        bundle_id: bundleId,
        user_id: user?.id || null,
        guest_name: user ? null : 'Guest User',
        photo_url: publicUrl,
        caption: caption || null,
        is_approved: false, // Requires admin approval
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Photo upload API error:', error);
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
      .from('recipe_user_photos')
      .select('*')
      .eq('bundle_id', bundleId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch photos error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ photos: data || [] });
  } catch (error: any) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
