// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const path = request.nextUrl.pathname

  // Bloquer les pages /war/* et API /api/war/*
  if (path.startsWith('/war') || path.startsWith('/api/war')) {
    // Redirige vers la vraie page /404
    const url = request.nextUrl.clone()
    url.pathname = '/404'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/war/:path*', '/api/war/:path*'],
}
