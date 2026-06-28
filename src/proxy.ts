import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './features/auth/utils/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos e de sistema
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // Configurar header personalizado para propagar o pathname para Server Components (como layouts)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Se tentar acessar área administrativa restrita sem login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Se já estiver logado e tentar ir para o login
  if (pathname.startsWith('/admin/login') && session) {
    const dashboardUrl = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
