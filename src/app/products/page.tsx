// import Link from "next/link";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // ✅ CORRECCIÓN: Usamos getProducts que es como se llama en tu db.ts
// import { getProducts } from "@/lib/db/db";

// export const revalidate = 0;

// export default async function ProductsPage() {
//   // ✅ CORRECCIÓN: Llamamos a getProducts()
//   const products = await getProducts();

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-6 text-center">Our Products</h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//         {products.map((p) => (
//           <Card key={p.ProductID}>
//             <CardHeader>
//               <CardTitle>
//                 <Link href={`/products/${p.ProductID}`} prefetch={false}>
//                   {p.ProductName}
//                 </Link>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p>Id: {p.ProductID}</p>
//               <p>Price: ${p.UnitPrice}</p>
//               <p>In Stock: {p.UnitsInStock}</p>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// -----     07-03-26 ----- CORRECCIÓN: Agregamos filtrado por categoría y el componente SidenavCategories ----- ////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// import Link from "next/link";
// import SidenavCategories from "@/components/app/SidenavCategories";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   getProducts,
//   getCategories,
//   getProductsByCategory,
// } from "@/lib/db/db";

// export const revalidate = 0;

// interface ProductsPageProps {
//   searchParams?: {
//     category?: string;
//   };
// }

// export default async function ProductsPage({
//   searchParams,
// }: ProductsPageProps) {
//   const categoryParam = searchParams?.category;
//   const selectedCategory = categoryParam ? Number(categoryParam) : undefined;

//   const categories = await getCategories();

//   const products =
//     selectedCategory !== undefined && !Number.isNaN(selectedCategory)
//       ? await getProductsByCategory(selectedCategory)
//       : await getProducts();

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-6 text-center">Our Products</h1>

//       <div className="flex flex-col md:flex-row gap-6">
//         <SidenavCategories
//           categories={categories}
//           selectedCategory={selectedCategory}
//         />

//         <section className="flex-1">
//           {products.length === 0 ? (
//             <p className="text-muted-foreground">
//               No hay productos en esta categoría.
//             </p>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//               {products.map((p) => (
//                 <Card key={p.ProductID}>
//                   <CardHeader>
//                     <CardTitle className="text-lg">
//                       <Link href={`/products/${p.ProductID}`} prefetch={false}>
//                         {p.ProductName}
//                       </Link>
//                     </CardTitle>
//                   </CardHeader>

//                   <CardContent className="space-y-1">
//                     <p>Id: {p.ProductID}</p>
//                     <p>Price: ${p.UnitPrice}</p>
//                     <p>In Stock: {p.UnitsInStock}</p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// }



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// -----     07-03-27 ----- CORRECCIÓN: Agregamos paginación ----- ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
import Link from "next/link";
import SidenavCategories from "@/components/app/SidenavCategories";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getCategories,
  getProductsPaginated,
  getProductsByCategoryPaginated,
  countProducts,
  countProductsByCategory,
} from "@/lib/db/db";

export const revalidate = 0;

interface ProductsPageProps {
  searchParams?: {
    category?: string;
    page?: string;
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const categoryParam = searchParams?.category;
  const pageParam = searchParams?.page;

  const selectedCategory = categoryParam ? Number(categoryParam) : undefined;
  const currentPage = pageParam ? Number(pageParam) : 1;

  const safePage = !Number.isNaN(currentPage) && currentPage > 0 ? currentPage : 1;

  const limit = 10;
  const offset = (safePage - 1) * limit;

  const categories = await getCategories();

  let products = [];
  let totalProducts = 0;

  if (selectedCategory !== undefined && !Number.isNaN(selectedCategory)) {
    products = await getProductsByCategoryPaginated(
      selectedCategory,
      limit,
      offset
    );
    totalProducts = await countProductsByCategory(selectedCategory);
  } else {
    products = await getProductsPaginated(limit, offset);
    totalProducts = await countProducts();
  }

  const totalPages = Math.ceil(totalProducts / limit);

  function buildPageLink(page: number) {
    if (selectedCategory !== undefined) {
      return `/products?category=${selectedCategory}&page=${page}`;
    }
    return `/products?page=${page}`;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Our Products</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <SidenavCategories
          categories={categories}
          selectedCategory={selectedCategory}
        />

        <section className="flex-1">
          {products.length === 0 ? (
            <p className="text-muted-foreground">
              No hay productos en esta categoría.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((p: any) => (
                  <Card key={p.ProductID}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <Link href={`/products/${p.ProductID}`} prefetch={false}>
                          {p.ProductName}
                        </Link>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-1">
                      <p>Id: {p.ProductID}</p>
                      <p>Price: ${p.UnitPrice}</p>
                      <p>In Stock: {p.UnitsInStock}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                {safePage > 1 && (
                  <Link
                    href={buildPageLink(safePage - 1)}
                    className="px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    Anterior
                  </Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={buildPageLink(page)}
                    className={`px-4 py-2 border rounded-md ${
                      page === safePage
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {page}
                  </Link>
                ))}

                {safePage < totalPages && (
                  <Link
                    href={buildPageLink(safePage + 1)}
                    className="px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}