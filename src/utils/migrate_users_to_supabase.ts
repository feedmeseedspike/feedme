// migrate_users_to_supabase.ts
// Usage:
// 1. npm install axios mongodb uuid
// 2. npx ts-node src/utils/migrate_users_to_supabase.ts

const axios = require('axios');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const MONGO_URI = 'mongodb+srv://FeedMe:Seedspike123456%23%23%23@feedme.fyweec0.mongodb.net/?retryWrites=true&w=majority&appName=FeedMe';
const DB_NAME = 'test';
const SUPABASE_URL = 'https://qafbcposwxopeoiuwyji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTk3NjksImV4cCI6MjA2Mjc5NTc2OX0.AItxs3-zqep_CpmqFcs9ZhjxkkSGBcoeII7wXcW8hLY';
const BATCH_SIZE = 50;

type MongoUser = {
  _id: { toString: () => string };
  name?: string;
  email?: string;
  avatar?: { url?: string };
  role?: string;
  status?: string;
  createdAt?: string | { $date: string };
};

type SupabaseUser = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
};

async function main() {
  const mongo = new MongoClient(MONGO_URI);
  const mongoIdToSupabaseId: Record<string, string> = {};
  try {
    await mongo.connect();
    const db = mongo.db(DB_NAME);
    const users: MongoUser[] = await db.collection('users').find({}).toArray();

    // Transform users
    const transformed: SupabaseUser[] = users.map((u) => {
      const id = uuidv4();
      mongoIdToSupabaseId[u._id.toString()] = id;
      let createdAt: string;
      if (u.createdAt) {
        if (typeof u.createdAt === 'string') {
          createdAt = new Date(u.createdAt).toISOString();
        } else if (typeof u.createdAt === 'object' && '$date' in u.createdAt) {
          createdAt = new Date((u.createdAt as any).$date).toISOString();
        } else {
          createdAt = new Date().toISOString();
        }
      } else {
        createdAt = new Date().toISOString();
      }
      return {
        id,
        display_name: u.name || null,
        email: u.email || null,
        avatar_url: u.avatar && u.avatar.url ? u.avatar.url : null,
        role: u.role || null,
        status: u.status || null,
        created_at: createdAt,
      };
    });

    // Insert in batches, fallback to single insert if batch fails
    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
      const batch = transformed.slice(i, i + BATCH_SIZE);
      const { data, error } = await insertBatch(batch);
      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} failed, inserting one by one...`);
        for (const user of batch) {
          const singleResult = await insertSingle(user);
          if (singleResult.error) {
            if (
              typeof singleResult.error === 'object' &&
              singleResult.error &&
              ('code' in singleResult.error && singleResult.error.code === '23505') ||
              (typeof singleResult.error.message === 'string' && singleResult.error.message.includes('duplicate'))
            ) {
              console.warn(`Duplicate skipped: ${user.email}`);
            } else {
              console.error(`Failed to insert user: ${user.email}`, singleResult.error);
            }
          } else {
            console.log(`Inserted: ${user.email}`);
          }
        }
      } else {
        console.log(`Inserted batch ${i / BATCH_SIZE + 1}:`, data);
      }
    }
    fs.writeFileSync('mongoIdToSupabaseUserId.json', JSON.stringify(mongoIdToSupabaseId, null, 2));
    console.log('User migration complete!');
  } catch (err) {
    console.error('User migration failed:', err);
  } finally {
    await mongo.close();
  }
}

async function insertBatch(batch: SupabaseUser[]) {
  try {
    const res = await axios.post(
      `${SUPABASE_URL}/rest/v1/users`,
      batch,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      }
    );
    return { data: res.data, error: null };
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'response' in error) {
      return { data: null, error: (error as any).response.data };
    }
    return { data: null, error };
  }
}

async function insertSingle(user: SupabaseUser) {
  try {
    const res = await axios.post(
      `${SUPABASE_URL}/rest/v1/users`,
      [user],
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      }
    );
    return { data: res.data, error: null };
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'response' in error) {
      return { data: null, error: (error as any).response.data };
    }
    return { data: null, error };
  }
}

main();