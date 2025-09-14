import ProductsClient from "@/components/products/ProductsClient";
import { Product } from "@/models/Product";

export default async function ProductsPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    // Fetch all products server-side from the API
    const response = await fetch("https://ecommerce.routemisr.com/api/v1/products", { 
      cache: "no-store" 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    products = data.data || [];
  } catch (err) {
    const serviceError = err as Error;
    error = serviceError.message || 'Failed to load products';
    console.error('Error loading products:', err);
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Products</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <p className="mt-2 text-sm text-red-600">
                Please try refreshing the page or check your internet connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Products</h1>
      
      {/* Client component handles all filtering, pagination, and display */}
      <ProductsClient products={products} />
    </div>
  );
}