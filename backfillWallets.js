// scripts/backfillWallets.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function backfillWallets() {
  // 1. Get all users
  const { data: users, error: userError } = await supabase.from('profiles').select('user_id');
  if (userError) throw userError;

  // 2. Get all wallets
  const { data: wallets, error: walletError } = await supabase.from('wallets').select('user_id');
  if (walletError) throw walletError;

  const walletUserIds = new Set(wallets.map(w => w.user_id));
  const usersWithoutWallet = users.filter(u => !walletUserIds.has(u.user_id));

  // 3. Insert wallets for users without one
  for (const user of usersWithoutWallet) {
    await supabase.from('wallets').insert({ user_id: user.user_id, balance: 0, currency: 'NGN' });
    console.log(`Created wallet for user: ${user.user_id}`);
  }
  console.log('Backfill complete!');
}

backfillWallets().catch(err => {
  console.error(err);
  process.exit(1);
});