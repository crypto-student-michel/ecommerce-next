import Link from "next/link";

interface Category {
  CategoryID: number;
  CategoryName: string;
}

interface SidenavCategoriesProps {
  categories: Category[];
  selectedCategory?: number;
}

export default function SidenavCategories({
  categories,
  selectedCategory,
}: SidenavCategoriesProps) {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Categorías</h2>

        <nav className="flex flex-col gap-2">
          <Link
            href="/products"
            className={`rounded-md px-3 py-2 transition hover:bg-muted ${
              selectedCategory === undefined
                ? "bg-primary text-primary-foreground"
                : "bg-transparent"
            }`}
          >
            Todas
          </Link>

          {categories.map((category) => (
            <Link
              key={category.CategoryID}
              href={`/products?category=${category.CategoryID}`}
              className={`rounded-md px-3 py-2 transition hover:bg-muted ${
                selectedCategory === category.CategoryID
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent"
              }`}
            >
              {category.CategoryName}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}