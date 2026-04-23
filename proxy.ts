// Authentication Proxy for Next.js 16+
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/login", "/signup"].includes(nextUrl.pathname);

  // Allow API auth routes and public routes
  if (isApiAuthRoute || isPublicRoute) {
    return;
  }

  // Redirect to login if not logged in and trying to access protected route
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
  
  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
