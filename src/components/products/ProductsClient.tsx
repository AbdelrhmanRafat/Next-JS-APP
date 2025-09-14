"use client";

import React, { useState, useMemo } from "react";
import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import { Product } from "@/models/Product";

interface ProductsClientProps {
  products: Product[];
}

interface FilterState {
  search: string;
  category: string;
  brand: string;
  priceMin: number | null;
  priceMax: number | null;
  sort: string;
}

const ProductsClient: React.FC<ProductsClientProps> = ({ products }) => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    brand: "",
    priceMin: null,
    priceMax: null,
    sort: "asc"
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      const matchesSearch = !filters.search || 
        product.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search.toLowerCase());
      
      // Category filter
      const matchesCategory = !filters.category || 
        product.category.name.toLowerCase() === filters.category.toLowerCase();
      
      // Brand filter
      const matchesBrand = !filters.brand || 
        product.brand.name.toLowerCase() === filters.brand.toLowerCase();
      
      // Price range filter
      const matchesPrice = 
        (!filters.priceMin || product.price >= filters.priceMin) &&
        (!filters.priceMax || product.price <= filters.priceMax);
      
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case "desc":
          return b.price - a.price;
        case "name":
          return a.title.localeCompare(b.title);
        case "asc":
        default:
          return a.price - b.price;
      }
    });

    return filtered;
  }, [products, filters]);

  // Apply pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Products count info */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {paginatedProducts.length} of {filteredProducts.length} products
          {filteredProducts.length !== products.length && ` (filtered from ${products.length} total)`}
          {totalPages > 1 && ` - Page ${currentPage} of ${totalPages}`}
        </p>
      </div>

      {/* Filters */}
      <ProductFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        products={products}
      />

      {/* Product Grid */}
      <ProductGrid products={paginatedProducts} />

      {/* Client-Side Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-4 py-2 border rounded-md ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ProductsClient;