import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "src/lib/supabaseClient";

type Handler = (request: Request, user_id: string) => Promise<NextResponse>;

export function authMiddleware(handler: Handler) {
  return async (request: Request) => {
    try {
      // Get the Supabase auth cookie using the project ID from environment variables
      const authCookie = request.headers.get("cookie")?.split("=")[1];
      // console.log("auth header => ", authCookie);

      // Check if the cookie exists
      if (!authCookie) {
        return NextResponse.json(
          { message: "Missing authentication cookie" },
          { status: 401 }
        );
      }
      let auths = authCookie.split("-")[1];

      // Decode the base64-encoded cookie to extract the access_token
      let authData;
      try {
        authData = JSON.parse(Buffer.from(auths, "base64").toString());
      } catch (error) {
        return NextResponse.json(
          { message: "Invalid authentication cookie" },
          { status: 401 }
        );
      }

      // Extract the access_token from the decoded cookie
      const { access_token } = authData;
      // console.log("accessttooken =>", access_token);
      // Verify the token with Supabase to get the user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(access_token);

      // Log user data in development mode for debugging
      if (process.env.NODE_ENV === "development") {
        // console.log("Auth middleware: user object", user);
      }

      // Handle errors from Supabase
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
    } catch (error: unknown) {
      // Handle unexpected errors
      const err = error as Error & { code?: string };
      console.error("Auth Middleware Error:", {
        message: err.message || "Unknown error",
        stack: err.stack,
      });
      return NextResponse.json(
        {
          message: "Authentication error",
          error:
            process.env.NODE_ENV === "development"
              ? err.message || "Unknown error"
              : "Internal server error",
          code: err.code || "UNKNOWN",
        },
        { status: 500 }
      );
    }
  };
}
