import { createClient } from 'src/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const bundleId = params.id;

    if (!bundleId) {
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      );
    }

    const { data: bundle, error } = await supabase
      .from('bundles')
      .select('id, slug, name, price, thumbnail_url')
      .eq('id', bundleId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch bundle: ${error.message}` },
        { status: 500 }
      );
    }

    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bundle }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE bundle API called with params:', params);
    const supabase = await createClient();
    const bundleId = params.id;

    console.log('Bundle ID:', bundleId);

    if (!bundleId) {
      console.log('No bundle ID provided');
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      );
    }

    console.log('Supabase client created, starting cascade delete...');
    
    // Step 1: Delete order_items that reference this bundle
    console.log('Deleting order_items...');
    const { error: orderItemsError, count: orderItemsCount } = await supabase
      .from('order_items')
      .delete()
      .eq('bundle_id', bundleId);

    console.log('Order items delete result:', { orderItemsError, orderItemsCount });

    if (orderItemsError) {
      console.error('Error deleting order_items:', orderItemsError);
      return NextResponse.json(
        { error: `Failed to delete order items: ${orderItemsError.message}` },
        { status: 500 }
      );
    }

    // Step 2: Delete bundle_products entries
    console.log('Deleting bundle_products...');
    const { error: bundleProductsError, count: bundleProductsCount } = await supabase
      .from('bundle_products')
      .delete()
      .eq('bundle_id', bundleId);

    console.log('Bundle products delete result:', { bundleProductsError, bundleProductsCount });

    if (bundleProductsError) {
      console.error('Error deleting bundle_products:', bundleProductsError);
      return NextResponse.json(
        { error: `Failed to delete bundle products: ${bundleProductsError.message}` },
        { status: 500 }
      );
    }

    // Step 3: Delete the bundle itself
    console.log('Deleting bundle...');
    const { error: deleteBundleError, count: bundleCount } = await supabase
      .from('bundles')
      .delete()
      .eq('id', bundleId);

    console.log('Bundle delete result:', { deleteBundleError, bundleCount });

    if (deleteBundleError) {
      console.error('Error deleting bundle:', deleteBundleError);
      return NextResponse.json(
        { error: `Failed to delete bundle: ${deleteBundleError.message}` },
        { status: 500 }
      );
    }

    console.log('Bundle deleted successfully');
    return NextResponse.json(
      { message: 'Bundle deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete bundle API error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}