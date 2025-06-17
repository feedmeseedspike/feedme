import { createClient } from "@utils/supabase/server";

export async function getReferralStatus() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, message: "Unauthorized" };
  }

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referrer_email, status')
      .eq('referrer_user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching referral status in query:', error);
      return { data: null, message: 'Error fetching referral status.' };
    }

    return { data, message: 'Referral status fetched successfully.' };
  } catch (error) {
    console.error('Unexpected error in getReferralStatus query:', error);
    return { data: null, message: 'An unexpected error occurred.' };
  }
}

export async function getReferredUsers() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], message: "Unauthorized" };
  }

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referred_user_email, status, referred_purchase_amount, created_at')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referred users:', error);
      return { data: [], message: 'Error fetching referred users.' };
    }

    return { data, message: 'Referred users fetched successfully.' };

  } catch (error) {
    console.error('Unexpected error in getReferredUsers query:', error);
    return { data: [], message: 'An unexpected error occurred.' };
  }
} 