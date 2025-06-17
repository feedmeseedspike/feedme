import { NextResponse } from 'next/server';
import { createClient } from '@utils/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch the referral record for the current user as a referrer
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referrer_email, status') // Select necessary fields
      .eq('referrer_user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching referral status:', error);
      return NextResponse.json({ message: 'Error fetching referral status.' }, { status: 500 });
    }

    // If no record is found, it means the user hasn't activated their referral program yet
    if (!data) {
      return NextResponse.json({ data: null, message: 'Referral program not activated.' }, { status: 200 });
    }

    return NextResponse.json({ data, message: 'Referral status fetched successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in referral status API:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
} 