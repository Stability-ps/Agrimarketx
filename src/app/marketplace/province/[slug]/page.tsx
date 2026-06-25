import { redirect } from "next/navigation";

export default async function OldProvinceRoute({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/province/${slug}` as never);
}
