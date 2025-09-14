// Products service - handles all product-related API calls
// This service layer abstracts external API calls and provides reusable functions

import { Product, ProductRoot, ProductsResponse, ProductServiceError, PaginationMetadata } from '@/models/Product';

// Base API configuration
const API_BASE_URL = 'https://ecommerce.routemisr.com/api/v1';
const DEFAULT_LIMIT = 20;

/**
 * Fetches products with pagination support
 * @param page - Page number (default: 1)
 * @param limit - Number of products per page (default: 40)
 * @returns Promise with products and pagination metadata
 */
export async function getProducts(
  page: number = 1,
  limit: number = 40
): Promise<ProductsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products?page=${page}&limit=${limit}`,
      {
        cache: 'no-store', // Always fetch fresh data for SSR
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    const data: ProductRoot = await response.json();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(data.results / limit);
    
    return {
      products: data.data,
      pagination: {
        currentPage: data.metadata.currentPage,
        totalPages,
        totalProducts: data.results,
        productsPerPage: limit,
        hasNextPage: data.metadata.currentPage < totalPages,
        hasPrevPage: data.metadata.currentPage > 1,
      },
    };
  } catch (error) {
    console.error('Error in getProducts service:', error);
    
    // Return meaningful error response
    const serviceError: ProductServiceError = {
      message: error instanceof Error ? error.message : 'Failed to fetch products',
      status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
    };
    
    throw serviceError;
  }
}

/**
 * Fetches a single product by ID
 * @param id - Product ID
 * @returns Promise with single product data
 */
export async function getProductById(id: string): Promise<Product> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/${id}`,
      {
        cache: 'no-store', // Always fetch fresh data for SSR
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Product with ID ${id} not found`);
      }
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error in getProductById service for ID ${id}:`, error);
    
    const serviceError: ProductServiceError = {
      message: error instanceof Error ? error.message : `Failed to fetch product ${id}`,
      status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
    };
    
    throw serviceError;
  }
}

/**
 * Searches products by query with pagination
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param limit - Number of products per page (default: 40)
 * @returns Promise with filtered products and pagination metadata
 */
export async function searchProducts(
  query: string,
  page: number = 1,
  limit: number = 40
): Promise<ProductsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products?page=${page}&limit=${limit}&keyword=${encodeURIComponent(query)}`,
      {
        cache: 'no-store', // Always fetch fresh data for SSR
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.status} ${response.statusText}`);
    }

    const data: ProductRoot = await response.json();
    const totalPages = Math.ceil(data.results / limit);
    
    return {
      products: data.data,
      pagination: {
        currentPage: data.metadata.currentPage,
        totalPages,
        totalProducts: data.results,
        productsPerPage: limit,
        hasNextPage: data.metadata.currentPage < totalPages,
        hasPrevPage: data.metadata.currentPage > 1,
      },
    };
  } catch (error) {
    console.error('Error in searchProducts service:', error);
    
    const serviceError: ProductServiceError = {
      message: error instanceof Error ? error.message : 'Failed to search products',
      status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
    };
    
    throw serviceError;
  }
}