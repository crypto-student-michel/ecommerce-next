import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAllProducts } from "@/lib/db/db";

export const revalidate = 0;

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Our Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.ProductID}>
            <CardHeader>
              <CardTitle>
                <Link href={`/products/${p.ProductID}`} prefetch={false}>
                  {p.ProductName}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Id: {p.ProductID}</p>
              <p>Price: ${p.UnitPrice}</p>
              <p>In Stock: {p.UnitsInStock}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
