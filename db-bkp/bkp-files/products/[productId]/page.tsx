import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getProduct } from "@/lib/db/db";
import Cantidad from "@/components/app/Cantidad";

type PageProps = {
  params: { productId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export const revalidate = 0;

export default async function ProductPage({ params, searchParams }: PageProps) {
  const id = Number(params.productId);
  if (!Number.isFinite(id)) notFound();

  const product = await getProduct(id);
  if (!product) notFound();

  const raw = searchParams?.cantidad;
  const cantidad =
    Array.isArray(raw)
      ? parseInt(raw[0] ?? "0", 10) || 0
      : parseInt((raw ?? "0") as string, 10) || 0;

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{product.ProductName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Id: {product.ProductID}</p>
          <p>Price: ${product.UnitPrice}</p>
          <p>In Stock: {product.UnitsInStock}</p>
          <Cantidad productoId={product.ProductID} cantidad={cantidad} />
        </CardContent>
      </Card>
    </div>
  );
}
