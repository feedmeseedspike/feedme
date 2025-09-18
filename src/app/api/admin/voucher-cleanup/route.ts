export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  runVoucherCleanup,
  getVoucherStats,
  softDeleteVouchers
} from '@/lib/actions/voucher-management.actions';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, voucherIds } = body;

    switch (action) {
      case 'cleanup':
        const cleanupResult = await runVoucherCleanup();
        return NextResponse.json(cleanupResult);

      case 'soft_delete':
        if (!voucherIds || !Array.isArray(voucherIds)) {
          return NextResponse.json({
            success: false,
            error: 'voucherIds array required for soft delete'
          }, { status: 400 });
        }
        const deleteResult = await softDeleteVouchers(voucherIds);
        return NextResponse.json(deleteResult);

      case 'stats':
        const statsResult = await getVoucherStats();
        return NextResponse.json(statsResult);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: cleanup, soft_delete, or stats'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Voucher cleanup API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Return voucher statistics
    const statsResult = await getVoucherStats();
    return NextResponse.json(statsResult);
  } catch (error: any) {
    console.error('Voucher stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}