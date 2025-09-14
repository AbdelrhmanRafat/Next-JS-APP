"use client";

import React from "react";
import { Product } from "@/models/Product";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-200">
      <div className="relative mb-4">
        <img
          src={product.imageCover}
          alt={product.title}
          className="w-full h-48 object-cover rounded-md"
        />
        {product.ratingsAverage && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-md text-sm font-semibold">
            ⭐ {product.ratingsAverage.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {product.title}
        </h3>
        
        <p className="text-sm text-gray-600">
          {product.brand.name}
        </p>
        
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-green-600">
            ${product.price}
          </span>
          
          <div className="text-sm text-gray-500">
            {product.quantity > 0 ? (
              <span className="text-green-600">In Stock</span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>
        </div>
        
        <button 
          className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400"
          disabled={product.quantity === 0}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;