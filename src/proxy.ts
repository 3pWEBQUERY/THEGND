import { NextResponse, type NextRequest } from "next/server";

/**
 * Reicht den aktuellen Pfad als Header weiter, damit Server-Komponenten
 * (z. B. `requireUser`) korrekt auf die Ursprungsseite zurückleiten können.
 */
export default function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)"],
};
