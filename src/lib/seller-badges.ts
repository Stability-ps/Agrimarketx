export type SellerAccountRole =
  | "farmer_seller"
  | "shop_seller"
  | "service_provider"
  | "advertiser"
  | "admin_created_seller"
  | "super_admin";

export type FarmSellerStatus = "not_started" | "pending_review" | "verified" | "rejected" | "suspended";

export const sellerAccountRoleLabels: Record<SellerAccountRole, string> = {
  farmer_seller: "Farmer Seller",
  shop_seller: "Shop Seller",
  service_provider: "Service Provider",
  advertiser: "Advertiser",
  admin_created_seller: "Admin Created Seller",
  super_admin: "Super Admin"
};

export const sellerStatusLabels: Record<FarmSellerStatus, string> = {
  not_started: "Not Started",
  pending_review: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended"
};

export function sellerAccountRoleLabel(role?: string | null) {
  return sellerAccountRoleLabels[(role ?? "farmer_seller") as SellerAccountRole] ?? "Farmer Seller";
}

export function sellerStatusLabel(status?: string | null) {
  return sellerStatusLabels[(status ?? "not_started") as FarmSellerStatus] ?? "Not Started";
}

export function sellerVerificationBadge(status?: string | null, role?: string | null) {
  if (status !== "verified") {
    return null;
  }

  if (role === "shop_seller") {
    return "Verified Business";
  }

  if (role === "service_provider") {
    return "Verified SP";
  }

  if (role === "advertiser") {
    return "Sponsored Partner";
  }

  return "Verified";
}

export function sellerTrustScore(emailVerified?: boolean | null, phoneVerified?: boolean | null) {
  return (emailVerified ? 50 : 0) + (phoneVerified ? 50 : 0);
}

export function automaticSellerStatus(emailVerified?: boolean | null, phoneVerified?: boolean | null) {
  return emailVerified && phoneVerified ? "verified" : "pending_review";
}
