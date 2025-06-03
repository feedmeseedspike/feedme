import { NextResponse } from "next/server";
import { supabase } from "src/lib/supabaseClient";

type Handler = (request: Request, user_id: string) => Promise<NextResponse>;

export function authMiddleware(handler: Handler) {
  return async (request: Request) => {
    try {
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

      return await handler(request, user.id);
    } catch (error: any) {
      console.error("Auth Middleware Error:", {
        message: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          message: "Authentication error",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
          code: error.code || "UNKNOWN",
        },
        { status: 500 }
      );
    }
  };
}
