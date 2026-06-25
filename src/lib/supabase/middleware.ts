import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const loggedInRoutes = [
  "/account",
  "/onboarding"
];

const sellerRoutes = [
  "/animals",
  "/breeding",
  "/dashboard",
  "/finance",
  "/health",
  "/marketplace/create",
  "/reports",
  "/subscription"
];

const adminRoutes = ["/admin"];

const protectedRoutes = [
  ...loggedInRoutes,
  ...sellerRoutes,
  ...adminRoutes
];

function routeMatches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = routeMatches(pathname, protectedRoutes);
  const isSellerRoute = routeMatches(pathname, sellerRoutes);
  const isAdminRoute = routeMatches(pathname, adminRoutes);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isProtected && pathname !== "/login") {
    return NextResponse.next({ request });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      url.searchParams.set("message", "Add Supabase keys to .env.local to sign in.");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let accountRole = "buyer";
  let accountTypeSelected = true;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_role, account_type_selected")
      .eq("id", user.id)
      .maybeSingle();

    accountRole = profile?.account_role ?? "buyer";
    accountTypeSelected = profile?.account_type_selected ?? false;
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = accountTypeSelected
      ? accountRole === "seller"
        ? "/dashboard"
        : "/marketplace"
      : "/account/type";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute && !["admin", "super_admin"].includes(accountRole)) {
    const url = request.nextUrl.clone();
    url.pathname = "/marketplace";
    url.searchParams.set("message", "Admin access is managed manually.");
    return NextResponse.redirect(url);
  }

  if (user && isSellerRoute && !["seller", "admin", "super_admin"].includes(accountRole)) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.searchParams.set("next", pathname);
    url.searchParams.set("message", "Set up your farm to use seller tools.");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
