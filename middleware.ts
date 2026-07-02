// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add allowed origins here
const allowedOrigins = ['https://ledxia.com', 'http://ledxia.com/servicios', 'https://us-central1-ledxia-c1316.cloudfunctions.net/xlsxSavecnfg'];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Define standard CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };

  // 1. Handle Preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...corsHeaders,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // 2. Handle standard requests (GET, POST, etc.)
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  // Set the remaining CORS headers onto the response object
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Only match API routes to avoid running middleware on frontend pages
export const config = {
  matcher: '/api/:path*',
};
