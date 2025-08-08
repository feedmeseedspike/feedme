import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Explicit types for handler and request
export function authMiddleware(
  handler: (request: Request, user_id: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      let response = NextResponse.next({ request });
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );
      // Use Supabase to get the user from the session
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user?.id) {
        if (error?.message?.includes("invalid JWT")) {
          return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { message: "No user found for this token" },
          { status: 401 }
        );
      }
      // Call the handler with the request and user ID
      return await handler(request.clone(), user.id);
    } catch (error: any) {
      // error is now typed as any
      console.error("Auth Middleware Error:", {
        message: error.message || "Unknown error",
        stack: error.stack,
      });
      return NextResponse.json(
        {
          message: "Authentication error",
          error:
            process.env.NODE_ENV === "development"
              ? error.message || "Unknown error"
              : "Internal server error",
          code: error.code || "UNKNOWN",
        },
        { status: 500 }
      );
    }
  };
}