import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { marketplaceCategoryTree } from "@/lib/marketplace-categories";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: dbCategories } = await supabase
    .from("marketplace_categories")
    .select("slug, label, active, seo_title, marketplace_subcategories(slug, label, active)")
    .order("label");

  const categories = dbCategories?.length ? dbCategories : marketplaceCategoryTree.map((category) => ({
    slug: category.slug,
    label: category.label,
    active: category.active,
    seo_title: category.seoTitle,
    marketplace_subcategories: category.subcategories.map((subcategory) => ({
      slug: subcategory.slug,
      label: subcategory.label,
      active: true
    }))
  }));

  return (
    <AppShell>
      <PageHeader title="Marketplace Categories" description="Manage the category structure used by listings, wanted requests, filters, seller setup and SEO pages." />
      <AdminNav />
      <section className="grid gap-4 lg:grid-cols-2">
        {categories.map((category: any) => {
          const subcategories = Array.isArray(category.marketplace_subcategories) ? category.marketplace_subcategories : [];

          return (
            <article key={category.slug} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-brand-navy">{category.label}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{category.slug}</p>
                  {category.seo_title ? <p className="mt-2 text-sm text-slate-600">{category.seo_title}</p> : null}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${category.active ? "bg-green-50 text-brand-green" : "bg-slate-100 text-slate-500"}`}>
                  {category.active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {subcategories.map((subcategory: any) => (
                  <span key={subcategory.slug} className={`rounded-full px-2 py-1 text-xs font-semibold ${subcategory.active ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-700"}`}>
                    {subcategory.label}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
