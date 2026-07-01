import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define your allowed origins or pull from environment variables
const allowedOrigins = [
  'http://localhost:3000/xlsxSavecnfg',
  'https://ledxia.com/xlsxSavecnfg',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Check if the request origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    };

    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle standard requests
  const response = NextResponse.next();
  
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  return response;
}

// Ensure the middleware only runs on your API routes
export const config = {
  matcher: '/api/:path*',
};
