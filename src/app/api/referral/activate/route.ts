import { NextResponse } from 'next/server';
import { createClient } from '@utils/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if the user already has an active referral record as a referrer
    const { data: existingReferrerRecord, error: existingError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_user_id', user.id)
      .single();

    if (existingReferrerRecord) {
      return NextResponse.json({ message: 'You have already activated your referral program.' }, { status: 200 });
    }

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing referrer record:', existingError);
      return NextResponse.json({ message: 'Error checking referral status.' }, { status: 500 });
    }

    // Create a new referral record for the current user as a referrer
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_user_id: user.id,
        referrer_email: user.email!, // Assuming email is always present for authenticated users
        status: 'pending',
      })
      .select();

    if (error) {
      console.error('Error activating referral program:', error);
      return NextResponse.json({ message: 'Failed to activate referral program.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Referral program activated successfully!', referral: data[0] }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in activate referral API:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
} 