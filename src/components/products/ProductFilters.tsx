// Product filters component
// Filter controls for category, price range, brand, and sorting
"use client";

import React, { useMemo } from "react";
import { Product } from "@/models/Product";

interface FilterState {
  search: string;
  category: string;
  brand: string;
  priceMin: number | null;
  priceMax: number | null;
  sort: string;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  products: Product[];
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onFiltersChange, products }) => {
  // Extract unique categories and brands from products
  const { categories, brands } = useMemo(() => {
    const categorySet = new Set<string>();
    const brandSet = new Set<string>();
    
    products.forEach(product => {
      if (product.category?.name) {
        categorySet.add(product.category.name);
      }
      if (product.brand?.name) {
        brandSet.add(product.brand.name);
      }
    });
    
    return {
      categories: Array.from(categorySet).sort(),
      brands: Array.from(brandSet).sort()
    };
  }, [products]);

  const handleFilterChange = (key: keyof FilterState, value: string | number | null) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 🔎 Search */}
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>

        {/* 📂 Category Filter */}
        <div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* 🏷️ Brand Filter */}
        <div>
          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* ↕️ Sort */}
        <div>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
          >
            <option value="asc">Price: Low → High</option>
            <option value="desc">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>
      </div>
      
      {/* 💰 Price Range */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
          <input
            type="number"
            placeholder="0"
            value={filters.priceMin || ''}
            onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full border px-3 py-2 rounded-md"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
          <input
            type="number"
            placeholder="No limit"
            value={filters.priceMax || ''}
            onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full border px-3 py-2 rounded-md"
            min="0"
          />
        </div>
      </div>
      
      {/* Clear Filters Button */}
      <div className="mt-4">
        <button
          onClick={() => onFiltersChange({
            search: '',
            category: '',
            brand: '',
            priceMin: null,
            priceMax: null,
            sort: 'asc'
          })}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilters;