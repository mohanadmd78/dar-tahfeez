import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/parent') || request.nextUrl.pathname.startsWith('/api/backup');

  if (isPublicRoute) {
    return response;
  }

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
