import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  secret: process.env.AUTH_SECRET || "development_secret_onda_2026",
  providers: [], // Los proveedores se definen en auth.ts para permitir acceso a la BD
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      
      // Lista de rutas que requieren autenticación
      const protectedRoutes = ['/', '/news', '/trending', '/local', '/research', '/redaction', '/director'];
      const isProtectedRoute = protectedRoutes.some(route => 
        nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
      );

      if (isProtectedRoute) {
        if (!isLoggedIn) return false;

        // Protección extra para la consola del director
        if (nextUrl.pathname.startsWith('/director') && (auth?.user as any)?.role !== 'admin') {
          return Response.redirect(new URL('/', nextUrl));
        }

        return true; 
      } else if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.sub = (user as { id?: string }).id || token.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.sub as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig
