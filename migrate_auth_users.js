const axios = require('axios');

// Service role keys from migrate_supabase.sh
const SRC_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxOTc2OSwiZXhwIjoyMDYyNzk1NzY5fQ.Pql9g65Ri_76h9xbmfl7L5CSSgSQZ4pvsemnLtLGjag';
const DEST_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bGRnc2txeHJmbXJoeWx1eG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk3NTc2NiwiZXhwIjoyMDY1NTUxNzY2fQ.Bd1xAR6fCom0HpcN7ngNP_MTI-gbsU-w1EzAjUFSrqE';

const SRC_PROJECT_REF = 'qafbcposwxopeoiuwyji';
const DEST_PROJECT_REF = 'fyldgskqxrfmrhyluxmw';

const SRC_API_URL = `https://${SRC_PROJECT_REF}.supabase.co/auth/v1/admin/users`;
const DEST_API_URL = `https://${DEST_PROJECT_REF}.supabase.co/auth/v1/admin/users`;

async function fetchAllUsers() {
  let users = [];
  let nextPage = null;
  do {
    const res = await axios.get(SRC_API_URL, {
      headers: { apiKey: SRC_SERVICE_ROLE, Authorization: `Bearer ${SRC_SERVICE_ROLE}` },
      params: { page: nextPage, per_page: 1000 }
    });
    users = users.concat(res.data.users || res.data);
    nextPage = res.data.next_page ?? null;
  } while (nextPage);
  return users;
}

async function deleteUserInDestByEmail(email) {
  try {
    const res = await axios.get(DEST_API_URL, {
      headers: { apiKey: DEST_SERVICE_ROLE, Authorization: `Bearer ${DEST_SERVICE_ROLE}` },
      params: { email }
    });
    const users = res.data.users || res.data;
    if (users && users.length > 0) {
      // Only try to delete the first user found
      const user = users[0];
      await axios.delete(`${DEST_API_URL}/${user.id}`, {
        headers: { apiKey: DEST_SERVICE_ROLE, Authorization: `Bearer ${DEST_SERVICE_ROLE}` }
      });
      console.log(`Deleted existing user in destination: ${email}`);
    }
  } catch (err) {
    console.error(`Failed to delete user ${email} in destination:`, err.response?.data || err.message);
  }
}

async function createUserInDest(user) {
  // Only copy supported fields
  const payload = {
    email: user.email,
    email_confirm: true,
    phone: user.phone,
    user_metadata: user.user_metadata || user.raw_user_meta_data || {},
    app_metadata: user.app_metadata || user.raw_app_meta_data || {},
    created_at: user.created_at,
    // You cannot set password directly; users will need to reset password if not using OAuth
  };
  try {
    await axios.post(DEST_API_URL, payload, {
      headers: { apiKey: DEST_SERVICE_ROLE, Authorization: `Bearer ${DEST_SERVICE_ROLE}` }
    });
    console.log(`Imported: ${user.email}`);
  } catch (err) {
    if (err.response?.data?.error_code === 'email_exists') {
      // Delete and retry
      await deleteUserInDestByEmail(user.email);
      try {
        await axios.post(DEST_API_URL, payload, {
          headers: { apiKey: DEST_SERVICE_ROLE, Authorization: `Bearer ${DEST_SERVICE_ROLE}` }
        });
        console.log(`Re-imported after delete: ${user.email}`);
      } catch (err2) {
        console.error(`Failed to re-import ${user.email}:`, err2.response?.data || err2.message);
      }
    } else {
      console.error(`Failed to import ${user.email}:`, err.response?.data || err.message);
    }
  }
}

(async () => {
  const users = await fetchAllUsers();
  console.log(`Fetched ${users.length} users from source project.`);
  for (const user of users) {
    await createUserInDest(user);
  }
  console.log('Auth user migration complete!');
})();