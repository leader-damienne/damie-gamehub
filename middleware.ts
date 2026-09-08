import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/" || path === "") {
    return NextResponse.rewrite(new URL("/enter", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
