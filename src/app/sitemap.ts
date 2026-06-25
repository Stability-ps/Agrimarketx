import type { MetadataRoute } from "next";
import { cityDirectory, provinceDirectory } from "@/lib/provinces";

const productionUrl = "https://agrimarketx.co.za";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const baseUrl =
  configuredSiteUrl && !configuredSiteUrl.includes("REPLACE-WITH-YOUR-VERCEL-DOMAIN")
    ? configuredSiteUrl
    : productionUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/marketplace",
    "/about",
    "/features",
    "/pricing",
    "/contact",
    "/faq"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/marketplace" ? 0.9 : 0.7
  }));

  const provinceRoutes = provinceDirectory.map((province) => ({
    url: `${baseUrl}/province/${province.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8
  }));

  const cityRoutes = cityDirectory().map((city) => ({
    url: `${baseUrl}/city/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75
  }));

  return [...staticRoutes, ...provinceRoutes, ...cityRoutes];
}
