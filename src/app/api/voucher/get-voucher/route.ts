export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Database } from 'src/utils/database.types'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const totalAmountParam = searchParams.get('totalAmount');

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json({ success: false, error: 'Voucher code is missing.' }, { status: 400 });
  }

  if (!totalAmountParam) {
    return NextResponse.json({ success: false, error: 'Total order amount is missing.' }, { status: 400 });
  }

  const totalAmount = parseFloat(totalAmountParam);
  if (isNaN(totalAmount) || totalAmount < 0) {
    return NextResponse.json({ success: false, error: 'Invalid total order amount.' }, { status: 400 });
  }

  try {
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('id, code, discount_type, discount_value, is_active, max_uses, used_count, valid_from, valid_to, min_order_amount, user_id')
      .eq('code', code)
      .eq('is_active', true) // Only get active vouchers
      .single();

    if (error || !voucher) {
      return NextResponse.json({ success: false, error: 'Invalid or expired voucher.' }, { status: 404 });
    }

    // Check if voucher is user-specific and belongs to current user
    if (voucher.user_id && voucher.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'This voucher is not valid for your account.' }, { status: 403 });
    }

    // Per-user usage check
    const { data: usage } = await supabase
      .from('voucher_usages')
      .select('id')
      .eq('user_id', user.id)
      .eq('voucher_id', voucher.id)
      .maybeSingle();
    if (usage) {
      return NextResponse.json({ success: false, error: 'You have already used this voucher.' }, { status: 400 });
    }

    // Detailed validation:
    if (!voucher.is_active) {
      return NextResponse.json({ success: false, error: 'Voucher is not active.' }, { status: 400 });
    }

    const now = new Date();
    if (voucher.valid_from && new Date(voucher.valid_from) > now) {
      return NextResponse.json({ success: false, error: 'Voucher is not yet valid.' }, { status: 400 });
    }
    if (voucher.valid_to && new Date(voucher.valid_to) < now) {
      return NextResponse.json({ success: false, error: 'Voucher has expired.' }, { status: 400 });
    }

    if (voucher.max_uses !== null && (voucher.used_count || 0) >= voucher.max_uses) {
      return NextResponse.json({ success: false, error: 'Voucher has reached its usage limit.' }, { status: 400 });
    }

    if (voucher.min_order_amount !== null && totalAmount < voucher.min_order_amount) {
      return NextResponse.json({ success: false, error: `Order total must be at least ${voucher.min_order_amount} to use this voucher.` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: {
      id: voucher.id,
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.discount_value,
      isActive: voucher.is_active, 
      usageLimit: voucher.max_uses === null ? null : voucher.max_uses - (voucher.used_count || 0), 
    } }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching voucher:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = body.code;
    const totalAmount = body.totalAmount;

    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'Voucher code is missing.' }, { status: 400 });
    }
    if (typeof totalAmount !== 'number' || isNaN(totalAmount) || totalAmount < 0) {
      return NextResponse.json({ success: false, error: 'Invalid total order amount.' }, { status: 400 });
    }

    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('id, code, discount_type, discount_value, is_active, max_uses, used_count, valid_from, valid_to, min_order_amount, user_id')
      .eq('code', code)
      .eq('is_active', true) // Only get active vouchers
      .single();

    if (error || !voucher) {
      return NextResponse.json({ success: false, error: 'Invalid or expired voucher.' }, { status: 404 });
    }

    // Check if voucher is user-specific and belongs to current user
    if (voucher.user_id && voucher.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'This voucher is not valid for your account.' }, { status: 403 });
    }

    // Per-user usage check
    const { data: usage } = await supabase
      .from('voucher_usages')
      .select('id')
      .eq('user_id', user.id)
      .eq('voucher_id', voucher.id)
      .maybeSingle();
    if (usage) {
      return NextResponse.json({ success: false, error: 'You have already used this voucher.' }, { status: 400 });
    }

    if (!voucher.is_active) {
      return NextResponse.json({ success: false, error: 'Voucher is not active.' }, { status: 400 });
    }
    const now = new Date();
    if (voucher.valid_from && new Date(voucher.valid_from) > now) {
      return NextResponse.json({ success: false, error: 'Voucher is not yet valid.' }, { status: 400 });
    }
    if (voucher.valid_to && new Date(voucher.valid_to) < now) {
      return NextResponse.json({ success: false, error: 'Voucher has expired.' }, { status: 400 });
    }
    if (voucher.max_uses !== null && (voucher.used_count || 0) >= voucher.max_uses) {
      return NextResponse.json({ success: false, error: 'Voucher has reached its usage limit.' }, { status: 400 });
    }
    if (voucher.min_order_amount !== null && totalAmount < voucher.min_order_amount) {
      return NextResponse.json({ success: false, error: `Order total must be at least ${voucher.min_order_amount} to use this voucher.` }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: {
      id: voucher.id,
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.discount_value,
      isActive: voucher.is_active, 
      usageLimit: voucher.max_uses === null ? null : voucher.max_uses - (voucher.used_count || 0), 
    } }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/voucher/get-voucher:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
} 