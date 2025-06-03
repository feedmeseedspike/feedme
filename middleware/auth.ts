import { NextResponse } from "next/server";
import { supabase } from "src/lib/supabaseClient";

export async function authMiddleware(
  handler: (request: Request, user_id: string) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return handler(request, user.id);
  };
}
