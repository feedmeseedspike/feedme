import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, description, category_ids, tags, options, price, list_price, images')
      .eq('is_published', true)
      .order('name');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ products, count: products?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
