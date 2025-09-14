# E-commerce Website - Next.js Project

This is a modern e-commerce website built with [Next.js 15](https://nextjs.org), React, TypeScript, and Tailwind CSS. The project follows industry best practices with a clean, scalable architecture designed for maintainability and growth.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Authentication & Authorization

This application includes a comprehensive authentication and authorization system with JWT tokens, secure cookie handling, route protection, and role-based access control.

### Authentication Flow

1. **Sign-Up/Sign-In**: Users authenticate via `/signup` or `/signin` pages
2. **JWT Token**: Server returns JWT token containing user info and roles
3. **Cookie Storage**: Token stored securely in HttpOnly cookies
4. **Middleware Protection**: Routes protected by middleware guards
5. **Context Management**: AuthContext provides global auth state
6. **Automatic Refresh**: Token validation and user data refresh

### Auth Service (`src/services/auth.service.ts`)

Provides authentication methods:

```typescript
// Sign up new user
await authService.signUp({ name, email, password });

// Sign in existing user
await authService.signIn({ email, password });

// Password reset flow
await authService.forgetPassword(email);
await authService.verifyResetCode(code);
await authService.resetPassword({ password, token });

// Decode JWT token
const userData = authService.decodeToken();
```

### Cookie Utilities (`src/utils/cookie.ts`)

Secure cookie management:

```typescript
// Client-side cookie operations
setCookie('token', jwtToken, { httpOnly: true, secure: true });
const token = getCookie('token');
removeCookie('token');

// Server-side cookie operations (API routes)
const serverCookies = new ServerCookies(request);
serverCookies.set('token', jwtToken);
```

### HTTP Wrapper (`src/utils/http.ts`)

Authenticated HTTP client with interceptors:

```typescript
// Automatic token attachment
const httpClient = new HttpClient();
const data = await httpClient.get('/api/protected-route');

// Loading state management
const { isLoading } = useHttpLoading();
```

### Authentication Context

Use the `useAuth` hook in components:

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, hasRole } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {hasRole('admin') && <AdminPanel />}
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### Authentication Guard in Layout

The authentication guard is implemented in `src/app/layout.tsx` using a combination of server-side and client-side protection to ensure all pages under this layout are automatically protected.

#### How the Guard Works

1. **Server-Side Protection**: The `getServerSideAuth` utility checks JWT tokens in cookies during SSR
2. **Client-Side Protection**: The `LayoutContent` component handles authentication state and redirects
3. **Automatic Redirects**: Unauthenticated users are redirected to `/signin`, authenticated users are redirected away from auth pages
4. **Role-Based Access**: Admin routes require admin role, user routes require authentication

#### Guard Placement

The guard is placed in the root layout (`src/app/layout.tsx`) which wraps all pages:

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutContent>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### Protected Pages

All pages under this layout are automatically protected based on route configuration:

**Guest-Only Routes** (redirect authenticated users to `/home`):
- `/signin` - Sign in page
- `/signup` - Sign up page

**Admin-Only Routes** (require admin role):
- `/admin/*` - Admin dashboard and management

**User Routes** (require authentication):
- `/home` - User dashboard
- `/profile` - User profile management
- `/orders` - Order history
- `/products` - Product catalog
- `/dashboard/*` - User dashboard sections

**Public Routes** (no authentication required):
- `/` - Homepage
- `/about` - About page
- `/contact` - Contact page
- `/unauthorized` - Access denied page

#### SSR and Client-Side Handling

The guard handles both server-side rendering and client-side navigation:

```typescript
// Server-side authentication check
const getServerSideAuth = (): { isAuthenticated: boolean; user: User | null; hasAdminRole: boolean } => {
  try {
    const token = getCookie('token');
    if (!token) return { isAuthenticated: false, user: null, hasAdminRole: false };
    
    const decoded = jwtDecode<DecodedToken>(token);
    const isAuthenticated = decoded.exp > Date.now() / 1000;
    const hasAdminRole = decoded.role === 'admin';
    
    return { isAuthenticated, user: decoded, hasAdminRole };
  } catch {
    return { isAuthenticated: false, user: null, hasAdminRole: false };
  }
};
```

#### Route Protection Logic

1. **Path Matching**: Uses the same path matching logic as middleware
2. **Authentication Check**: Validates JWT token from cookies
3. **Role Validation**: Checks user role for admin routes
4. **Redirect Handling**: Uses Next.js router for client-side redirects
5. **Loading States**: Shows loading spinner during authentication checks

### Route Protection & Middleware

Middleware automatically protects routes based on configuration:

```typescript
// Protected routes (require authentication)
- /dashboard/*
- /profile/*
- /orders/*
- /admin/* (admin role required)

// Public routes (no authentication required)
- /
- /about
- /contact
- /signin
- /signup
```

### Higher-Order Components

Protect components with authentication:

```typescript
// Require authentication
export default withAuth(MyProtectedComponent);

// Require specific role
export default withRole(AdminComponent, 'admin');
```

### Role-Based Access Control

Roles are stored in JWT tokens and checked by middleware:

- **admin**: Full access to all routes including `/admin/*`
- **user**: Access to user-specific routes like `/dashboard`, `/profile`
- **guest**: Public routes only

### Sign-In Page (`/signin`)

Features:
- Email and password validation
- Error handling and display
- Loading states
- Automatic redirect after successful login
- Password visibility toggle

### Sign-Up Page (`/signup`)

Features:
- Comprehensive form validation (name, email, password, confirm password)
- Password strength indicator
- Real-time validation feedback
- Error handling with field-specific messages
- Automatic redirect to sign-in after successful registration

### Security Features

- **HttpOnly Cookies**: Prevents XSS attacks
- **Secure Cookies**: HTTPS-only in production
- **JWT Validation**: Server-side token verification
- **Route Guards**: Middleware-based protection
- **Password Strength**: Enforced strong passwords
- **CSRF Protection**: Built-in Next.js protection

### Error Handling

- **Global Error Interceptor**: Automatic token expiry handling
- **Field Validation**: Real-time form validation
- **Network Errors**: User-friendly error messages
- **Loading States**: Visual feedback during operations

### Usage Examples

#### Protecting a Page

```typescript
'use client';
import { withAuth } from '@/context/AuthContext';

function DashboardPage() {
  return <div>Protected Dashboard Content</div>;
}

export default withAuth(DashboardPage);
```

#### Role-Based Component

```typescript
'use client';
import { withRole } from '@/context/AuthContext';

function AdminPanel() {
  return <div>Admin Only Content</div>;
}

export default withRole(AdminPanel, 'admin');
```

#### Manual Authentication Check

```typescript
function ConditionalContent() {
  const { isAuthenticated, hasRole } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome back!</p>
          {hasRole('admin') && <AdminButton />}
        </div>
      ) : (
        <Link href="/signin">Please sign in</Link>
      )}
    </div>
  );
}
```

## 📁 Project Structure Guide

This section explains every folder and key file in the project to help you understand the architecture and find what you need quickly.

```
my-app/
├── __tests__/                    # Testing files and test utilities
├── public/                        # Static assets served directly by the web server
├── src/                          # Main source code directory
│   ├── app/                      # Next.js App Router - pages and API routes
│   ├── assets/                   # Static assets like images, icons, and styles
│   ├── components/               # Reusable React components
│   ├── config/                   # Configuration files and settings
│   ├── context/                  # React Context providers for global state
│   ├── hooks/                    # Custom React hooks
│   ├── middleware/               # Server middleware for authentication, etc.
│   ├── models/                   # TypeScript interfaces and data models
│   ├── services/                 # API calls and business logic
│   └── utils/                    # Helper functions and utilities
├── next.config.ts                # Next.js configuration
├── package.json                  # Project dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

### 🧪 `__tests__/` - Testing Directory
Contains all test files to ensure your code works correctly.

- **`components/ui/`** - Tests for UI components like buttons and forms
- **`integration/api/`** - Tests that check if different parts work together (like API endpoints)
- **`services/`** - Tests for business logic and API calls
- **`utils/testUtils.ts`** - Helper functions and mock data for testing

### 🌐 `public/` - Static Files
Files that are served directly to users without processing.

- **SVG files** - Icons and graphics that don't change
- **Images** - Logos, backgrounds, and other static images
- **Fonts** - Custom font files (if any)

### 📱 `src/app/` - Next.js App Router
This is where your website pages and API endpoints live. Next.js automatically creates routes based on folder structure.

#### Pages (User Interface)
- **`(auth)/`** - Authentication pages (login, register)
  - **`login/page.tsx`** - Login form page
  - **`register/page.tsx`** - User registration page
  - **`layout.tsx`** - Shared layout for auth pages
- **`cart/page.tsx`** - Shopping cart page showing items to purchase
- **`checkout/page.tsx`** - Payment and order completion page
- **`orders/`** - Order management pages
  - **`page.tsx`** - List of user's past orders
  - **`[id]/page.tsx`** - Individual order details (dynamic route)
- **`products/`** - Product browsing pages
  - **`page.tsx`** - Main product listing page
  - **`[id]/page.tsx`** - Individual product details page
  - **`categories/[category]/page.tsx`** - Products filtered by category
- **`profile/page.tsx`** - User account settings and information
- **`page.tsx`** - Homepage of your website
- **`layout.tsx`** - Main layout wrapper for all pages
- **`globals.css`** - Global CSS styles applied to entire website

#### API Routes (Backend)
- **`api/auth/`** - User authentication endpoints
  - **`login/route.ts`** - Handles user login requests
  - **`register/route.ts`** - Handles new user registration
  - **`logout/route.ts`** - Handles user logout
- **`api/products/`** - Product data endpoints
  - **`route.ts`** - Get all products, search, filter
  - **`[id]/route.ts`** - Get specific product details
- **`api/cart/route.ts`** - Shopping cart operations (add, remove, update)
- **`api/orders/route.ts`** - Order creation and management

### 🎨 `src/assets/` - Static Assets
Organized static files used throughout your application.

- **`icons/`** - SVG icons for UI elements
  - **`cart.svg`** - Shopping cart icon
  - **`user.svg`** - User profile icon
  - **`search.svg`** - Search functionality icon
- **`images/`** - Photos and graphics
  - **`placeholder.svg`** - Default image when product photos are missing
- **`styles/`** - Custom CSS files
  - **`theme.css`** - Custom design tokens and theme variables

### 🧩 `src/components/` - Reusable Components
Breaking your UI into small, reusable pieces makes development easier and more organized.

#### UI Components (Basic Building Blocks)
- **`ui/Button.tsx`** - Customizable button component with different styles
- **`ui/Input.tsx`** - Form input fields with validation styling
- **`ui/Modal.tsx`** - Popup dialogs and overlays
- **`ui/Card.tsx`** - Container component for displaying content
- **`ui/Loading.tsx`** - Loading spinners and skeleton screens

#### Layout Components (Page Structure)
- **`layout/Header.tsx`** - Main navigation component with site title (My Shop) and navigation links to Home (/), Products (/products), and About (/about). Features responsive design with mobile menu toggle and Tailwind CSS styling.
- **`layout/Footer.tsx`** - Site footer component displaying copyright information with the current year. Uses dark theme styling and is positioned at the bottom of the page.
- **`layout/Sidebar.tsx`** - Side navigation and filters

**Global Layout Structure (`src/app/layout.tsx`):**
The root layout implements a responsive flex structure with `flex flex-col min-h-screen` that ensures:
- Header stays fixed at the top
- Main content area expands with `flex-grow` to fill available space
- Footer stays fixed at the bottom
- This structure is applied to all pages across the application

#### Feature Components (Business Logic)
- **`auth/LoginForm.tsx`** - Login form with validation
- **`auth/RegisterForm.tsx`** - Registration form with validation
- **`products/ProductCard.tsx`** - Individual product display card
- **`products/ProductGrid.tsx`** - Grid layout for multiple products
- **`products/ProductFilters.tsx`** - Search and filter controls
- **`cart/CartItem.tsx`** - Individual item in shopping cart
- **`cart/CartSummary.tsx`** - Cart totals and checkout button
- **`orders/OrderCard.tsx`** - Summary display of an order
- **`orders/OrderStatus.tsx`** - Visual order tracking progress

### ⚙️ `src/config/` - Configuration
Centralized settings and configuration for your application.

- **`env.ts`** - Environment variables (API keys, database URLs) with type safety
- **`database.ts`** - Database connection settings and configuration

### 🌍 `src/context/` - Global State Management
React Context providers that share data across your entire application.

- **`AuthContext.tsx`** - Manages user login status and user information globally
- **`CartContext.tsx`** - Manages shopping cart state across all pages

### 🎣 `src/hooks/` - Custom React Hooks
Reusable logic that can be shared between components.

- **`useAuth.ts`** - Hook for accessing user authentication state and functions
- **`useCart.ts`** - Hook for managing shopping cart operations

### 🛡️ `src/middleware/` - Server Middleware
Code that runs before your pages load to handle security and processing.

- **`auth.ts`** - Protects pages that require user login
- **`rateLimit.ts`** - Prevents API abuse by limiting request frequency

### 📋 `src/models/` - Data Models
TypeScript interfaces that define the shape of your data.

- **`User.ts`** - User account data structure (name, email, etc.)
- **`Product.ts`** - Product information structure (name, price, description, etc.)
- **`Cart.ts`** - Shopping cart data structure (items, quantities, totals)
- **`Order.ts`** - Order information structure (items, status, shipping, etc.)

### 🔧 `src/services/` - Service Layer (API Abstraction)
Service functions that handle all external API calls and business operations. This layer ensures clean separation between UI components and data fetching.

- **`api/productsService.ts`** - Product operations with pagination support:
  - `getProducts(page, limit)` - Fetch products with pagination metadata
  - `getProductById(id)` - Fetch single product details
  - `searchProducts(query, page, limit)` - Search products with pagination
  - Includes proper error handling and TypeScript interfaces
- **`api/authService.ts`** - Authentication operations (login, register, logout)
- **`api/cartService.ts`** - Shopping cart operations (add, remove, update items)
- **`api/ordersService.ts`** - Order management (create, track, history)

### 🛠️ `src/utils/` - Helper Functions
Small utility functions used throughout your application.

- **`validation.ts`** - Functions to validate forms (email format, password strength, etc.)
- **`formatting.ts`** - Functions to format data for display (currency, dates, etc.)
- **`constants.ts`** - Application-wide constants (API URLs, default values, etc.)

## 🏗️ Architecture Benefits

- **Feature-based organization** - Related files are grouped together
- **Separation of concerns** - UI, business logic, and data are clearly separated
- **Reusability** - Components and functions can be easily reused
- **Maintainability** - Easy to find and update specific functionality
- **Scalability** - Structure supports growth as your project expands
- **Type safety** - TypeScript ensures data consistency and catches errors early

## 🌐 Full Page SSR Navigation with HTML Responses

This project implements true Server-Side Rendering with full page navigation, ensuring that the browser network tab shows clean HTML responses instead of React Server Component (RSC) serialization payloads.

### Full Page Navigation Implementation

The products page demonstrates complete SSR with traditional web navigation patterns:

1. **Server Component with searchParams** (`src/app/products/page.tsx`)
   ```typescript
   interface ProductsPageProps {
     searchParams: { page?: string; };
   }
   
   export default async function ProductsPage({ searchParams }: ProductsPageProps) {
     const currentPage = parseInt(searchParams.page || '1', 10);
     const productsData = await getProducts(currentPage, 20);
     // Server-side data fetching - no client-side effects
   }
   ```
   - **No "use client"** - Fully server-rendered component
   - **No useEffect/useState** - Pure server-side data fetching
   - **URL-based state** - Page state comes from searchParams only
   - **Fresh HTML on every request** - Complete page re-render

2. **Service Layer with No-Cache Policy** (`src/services/api/productsService.ts`)
   ```typescript
   const response = await fetch(url, {
     cache: 'no-store', // Prevents RSC caching, ensures fresh data
     headers: { 'Content-Type': 'application/json' }
   });
   ```
   - **`cache: 'no-store'`** on all fetch calls prevents RSC serialization
   - **Server-only execution** - No client-side data fetching
   - **Fresh data guarantee** - Every page load gets latest data

3. **Anchor-Based Pagination** (`src/components/products/Pagination.tsx`)
   ```typescript
   // Uses regular <a href> tags instead of Next.js Link
   <a href={`${basePath}?page=${pageNum}`} className="...">
     {pageNum}
   </a>
   ```
   - **Regular `<a href>` tags** - No client-side routing
   - **Full page navigation** - Browser performs complete page reload
   - **HTML responses only** - Network tab shows document requests, not RSC payloads
   - **Traditional web behavior** - Works exactly like classic server-rendered sites

### Network Tab Behavior

**✅ What you'll see in browser Network tab:**
- **Document requests** for each page navigation
- **Clean HTML responses** with fully rendered content
- **Traditional page loads** with proper HTTP status codes
- **No RSC serialization** or React Flight payloads

**❌ What you WON'T see:**
- React Server Component serialization data
- Client-side JavaScript navigation requests
- Partial page updates or streaming responses
- Complex payload structures

### Data Flow Architecture

```
User clicks <a href="/products?page=2"> → Full Page Request → Server Component
                                                                      ↓
                                                            productsService (cache: no-store)
                                                                      ↓
                                                              External API Request
                                                                      ↓
                                                            Complete HTML Response
                                                                      ↓
                                                            Browser renders new page
```

### Benefits of Full Page SSR Navigation

- **Pure HTML Responses** - Network tab shows clean document requests
- **No RSC Complexity** - Eliminates React Server Component serialization
- **Traditional Web Behavior** - Works like classic server-rendered applications
- **SEO Optimized** - Each page is a complete HTML document
- **Performance** - No client-side JavaScript execution for navigation
- **Accessibility** - Standard anchor tag navigation for screen readers
- **Browser Compatibility** - Works without JavaScript enabled
- **Debugging Simplicity** - Easy to inspect network requests and responses

### URL Structure

- **Products Page**: `/products` (defaults to page 1)
- **Paginated Pages**: `/products?page=2`, `/products?page=3`, etc.
- **Each URL returns**: Complete HTML document with server-rendered content
- **Future Extensions**: `/products?page=2&category=electronics&sort=price`

### API Routes (Optional Proxy)

The `/api/products` route serves as an optional proxy for:
- Server-to-server communication
- Internal API calls
- Future CRUD operations (POST, PUT, DELETE placeholders included)

## 📚 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [React Documentation](https://react.dev) - Learn about React components and hooks
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Learn about TypeScript
- [Tailwind CSS](https://tailwindcss.com/docs) - Learn about utility-first CSS

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
