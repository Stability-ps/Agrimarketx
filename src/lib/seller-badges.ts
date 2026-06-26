export type SellerAccountRole =
  | "individual_seller"
  | "business_seller"
  | "sponsored_partner"
  | "farmer_seller"
  | "shop_seller"
  | "service_provider"
  | "advertiser"
  | "admin_created_seller"
  | "super_admin";

export type FarmSellerStatus =
  | "not_started"
  | "pending"
  | "pending_review"
  | "documents_submitted"
  | "documents_approved_pending_facial_verification"
  | "facial_verification_pending"
  | "verified"
  | "rejected"
  | "suspended"
  | "more_information_required";

export const sellerAccountRoleLabels: Record<SellerAccountRole, string> = {
  individual_seller: "Individual Seller",
  business_seller: "Business Seller",
  sponsored_partner: "Sponsored Partner",
  farmer_seller: "Farmer Seller",
  shop_seller: "Shop Seller",
  service_provider: "Service Provider",
  advertiser: "Advertiser",
  admin_created_seller: "Admin Created Seller",
  super_admin: "Super Admin"
};

export const sellerStatusLabels: Record<FarmSellerStatus, string> = {
  not_started: "Not Started",
  pending: "Pending",
  pending_review: "Pending",
  documents_submitted: "Documents Submitted",
  documents_approved_pending_facial_verification: "Documents Approved",
  facial_verification_pending: "Facial Verification Pending",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
  more_information_required: "More Information Required"
};

export function sellerAccountRoleLabel(role?: string | null) {
  return sellerAccountRoleLabels[(role ?? "farmer_seller") as SellerAccountRole] ?? "Farmer Seller";
}

export function sellerStatusLabel(status?: string | null) {
  return sellerStatusLabels[(status ?? "not_started") as FarmSellerStatus] ?? "Not Started";
}

export function sellerVerificationBadge(status?: string | null, role?: string | null, sellerType?: string | null, sponsoredPartner?: boolean | null) {
  if (status !== "verified") {
    return null;
  }

  if (sponsoredPartner || role === "sponsored_partner" || role === "advertiser") {
    return "Sponsored Partner";
  }

  if (sellerType === "business" || role === "business_seller" || role === "shop_seller") {
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
  return (emailVerified ? 20 : 0) + (phoneVerified ? 20 : 0);
}

export function verificationTrustScore({
  emailVerified,
  phoneVerified,
  facialVerified,
  documentsApproved,
  sellerType
}: {
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  facialVerified?: boolean | null;
  documentsApproved?: boolean | null;
  sellerType?: string | null;
}) {
  if (sellerType === "business") {
    return (emailVerified ? 20 : 0) + (phoneVerified ? 20 : 0) + (documentsApproved ? 20 : 0) + (facialVerified ? 40 : 0);
  }

  return (emailVerified ? 20 : 0) + (phoneVerified ? 20 : 0) + (facialVerified ? 60 : 0);
}

export function automaticSellerStatus({
  emailVerified,
  phoneVerified,
  facialStatus,
  documentStatus,
  sellerType
}: {
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  facialStatus?: string | null;
  documentStatus?: string | null;
  sellerType?: string | null;
}) {
  if (!emailVerified || !phoneVerified) {
    return "pending";
  }

  if (sellerType === "business") {
    if (documentStatus === "approved" && facialStatus === "verified") {
      return "verified";
    }

    if (documentStatus === "approved") {
      return "documents_approved_pending_facial_verification";
    }

    if (documentStatus === "submitted") {
      return "documents_submitted";
    }

    if (documentStatus === "more_information_required") {
      return "more_information_required";
    }

    if (documentStatus === "rejected") {
      return "rejected";
    }
  }

  if (facialStatus === "verified") {
    return "verified";
  }

  if (facialStatus === "pending") {
    return "facial_verification_pending";
  }

  return "pending";
}
