import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Permanent (308) redirects for tutorials whose slugs were changed to more
 * SEO-friendly forms. Preserves link equity from the old, indexed URLs.
 * Key = old path, value = new path.
 */
const SLUG_REDIRECTS: Record<string, string> = {
  "/tutorials/python_packages_and_pip": "/tutorials/python-packages-and-pip",
  "/tutorials/guide-to-lambda-expressons": "/tutorials/python-lambda-expressions",
  "/tutorials/working-with-database": "/tutorials/python-working-with-databases",
  "/tutorials/working-with-web-apis": "/tutorials/python-working-with-web-apis",
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const target = SLUG_REDIRECTS[pathname];
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser favicon)
     * - public assets (images, svgs, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
