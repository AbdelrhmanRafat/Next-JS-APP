// Product model interfaces
// TypeScript types for product data, categories, and variants based on API response

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category: string;
}

export interface Product {
  _id: string;
  id: string;
  title: string;
  slug: string;
  description: string;
  quantity: number;
  price: number;
  sold: number;
  images: string[];
  imageCover: string;
  category: Category;
  subcategory: Subcategory[];
  brand: Brand;
  ratingsAverage: number;
  ratingsQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Metadata {
  currentPage: number;
  numberOfPages: number;
  limit: number;
  nextPage?: number;
}

export interface ProductRoot {
  results: number;
  metadata: Metadata;
  data: Product[];
}

// Enhanced pagination interfaces for service layer
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  productsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationMetadata;
}

export interface ProductServiceError {
  message: string;
  status?: number;
  code?: string;
}