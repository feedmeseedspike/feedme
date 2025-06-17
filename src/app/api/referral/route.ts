import { NextResponse } from 'next/server';
import { createClient } from '@utils/supabase/server';
import { createVoucher } from 'src/lib/actions/voucher.actions';
import { TablesInsert } from 'src/utils/database.types'; // Import TablesInsert

export async function POST(request: Request) {
  const supabase = createClient();

  const { referrerEmail, referredUserId, referredUserEmail } = await request.json();

  console.log('Received referral request:', { referrerEmail, referredUserId, referredUserEmail });

  if (!referrerEmail || !referredUserId || !referredUserEmail) {
    return NextResponse.json({ message: 'Missing required referral parameters.' }, { status: 400 });
  }

  try {
    // 1. Validate referrer email and get referrer_user_id
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', referrerEmail)
      .single();

    if (referrerError || !referrerData) {
      console.error('Referrer email not found or error fetching referrer:', referrerError);
      return NextResponse.json({ message: 'Invalid referral code (referrer email not found).' }, { status: 404 });
    }

    // Check if a record with this referrer_email already exists in the referrals table
    console.log('Checking for existing referrer email record...');
    const { data: existingReferrerEmailRecord, error: existingReferrerEmailError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_email', referrerEmail)
      .single();

    console.log('Existing referrer email record check result:', { existingReferrerEmailRecord, existingReferrerEmailError });

    if (existingReferrerEmailRecord) {
      // If a record with this referrer_email already exists, return a 409 conflict.
      // This handles the unique constraint on referrer_email.
      console.log('Referral for this referrer has already been processed (409).');
      return NextResponse.json({ message: 'Referral for this referrer has already been processed.' }, { status: 409 });
    }

    if (existingReferrerEmailError && existingReferrerEmailError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing referrer email in referrals table:', existingReferrerEmailError);
      return NextResponse.json({ message: 'Error processing referral status for referrer email.' }, { status: 500 });
    }

    // 2. Check if this referredUserId has already applied a referral
    console.log('Checking if referred user ID has already applied a referral...');
    const { data: existingReferral, error: existingReferralError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', referredUserId)
      .single();

    console.log('Existing referred user referral check result:', { existingReferral, existingReferralError });

    if (existingReferral) {
      console.log('This user has already applied a referral code (409).');
      return NextResponse.json({ message: 'This user has already applied a referral code.' }, { status: 409 });
    }

    if (existingReferralError && existingReferralError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing referral:', existingReferralError);
      return NextResponse.json({ message: 'Error processing referral.' }, { status: 500 });
    }

    // 3. Insert the referral record
    const referralInsertData: TablesInsert<'referrals'> = {
      referrer_user_id: referrerData.id,
      referrer_email: referrerData.email as string,
      referred_user_id: referredUserId,
      referred_user_email: referredUserEmail,
      status: 'pending',
      referred_discount_given: false,
      referred_purchase_amount: 0,
      referrer_discount_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Attempting to insert new referral record:', referralInsertData);

    const { error: insertError } = await supabase
      .from('referrals')
      .insert(referralInsertData);

    if (insertError) {
      console.error('Error inserting referral:', insertError);
      return NextResponse.json(
        { message: 'Failed to create referral record.', error: insertError.message },
        { status: 500 }
      );
    }

    console.log('Referral record inserted successfully.');

    return NextResponse.json({ message: 'Referral applied successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('Unhandled error in /api/referral:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.', error: error.message }, { status: 500 });
  }
} 