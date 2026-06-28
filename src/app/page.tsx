import type { Metadata } from "next";
import MarketplacePage from "@/app/marketplace/page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AgriMarketX Marketplace | Buy and Sell Agricultural Products",
  description: "Search livestock, feed, crops, equipment, vehicles, infrastructure and agricultural services on AgriMarketX."
};

type HomeSearchParams = Promise<{
  message?: string;
  q?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  sex?: string;
  price?: string;
  contact?: string;
  page?: string;
}>;

export default async function HomePage({
  searchParams
}: {
  searchParams: HomeSearchParams;
}) {
  return <MarketplacePage searchParams={searchParams} />;
}
