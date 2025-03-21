import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();
  const { userId } = authObject;

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return authObject.redirectToSignIn({ returnBackUrl: req.url });
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && isProtectedRoute(req)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
}; 