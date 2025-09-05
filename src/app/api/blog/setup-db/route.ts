import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // Use service role client to create database function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create the increment views function
    const functionSql = `
      CREATE OR REPLACE FUNCTION increment_blog_post_views(post_id UUID)
      RETURNS VOID AS $$
      BEGIN
        UPDATE blog_posts 
        SET views_count = views_count + 1 
        WHERE id = post_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: functionSql });

    if (error) {
      console.error("Error creating function:", error);
      // Try alternative approach
      const { error: directError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
      
      if (directError) {
        throw directError;
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Database connection verified. Function may already exist.",
        note: "Please run the SQL function manually in Supabase dashboard"
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database function created successfully"
    });

  } catch (error) {
    console.error("Error setting up database:", error);
    return NextResponse.json(
      { success: false, error: "Failed to setup database functions" }, 
      { status: 500 }
    );
  }
}