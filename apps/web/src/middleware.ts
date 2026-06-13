import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from './lib/supabase-server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseMiddlewareClient(request, response)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/termos', '/privacidade', '/planos']

  if (!session && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image|robots.txt|sitemap.xml|api|auth).*)'],
}
