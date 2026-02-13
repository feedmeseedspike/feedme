import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'


export async function middleware(request: NextRequest) {
  // Update session and get user/response
  const { response, user } = await updateSession(request);

  // Only run redirect logic for auth pages
  const authPages = ['/login', '/register'];
  const { pathname } = request.nextUrl;

  if (authPages.some((path) => pathname.startsWith(path))) {
    if (user) {
      // Redirect authenticated users to home or dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}