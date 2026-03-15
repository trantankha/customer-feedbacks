import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // 1. Check if the route is protected
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                             request.nextUrl.pathname.startsWith('/customers');
    
    // Auth checking is handled purely via client-side for now via the api interceptor
    // combined with a client component layout wrapper. 
    // We can't easily check localStorage from edge middleware, and parsing JWTs
    // here requires Jose. So we will just do basic routing redirects if someone
    // hits '/' they go to '/' but if we want we can redirect to login.
    
    // For now, let the client-side axios interceptor handle the heavy lifting
    // of 401 redirects when API calls fail.
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
