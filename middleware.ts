import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
  // Ajuste de matcher para Next.js 15
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
