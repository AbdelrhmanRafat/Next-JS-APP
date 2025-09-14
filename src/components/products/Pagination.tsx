// Using regular anchor tags for full page navigation to avoid RSC serialization

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  basePath?: string; // Default to '/products'
}

export default function Pagination({
  currentPage,
  totalPages,
  totalProducts,
  hasNextPage,
  hasPrevPage,
  basePath = '/products'
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center space-y-4 mt-8">
      {/* Pagination Info */}
      <div className="text-sm text-gray-600">
        Showing page {currentPage} of {totalPages} ({totalProducts} total products)
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        {hasPrevPage ? (
          <a
            href={`${basePath}?page=${currentPage - 1}`}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            Previous
          </a>
        ) : (
          <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed">
            Previous
          </span>
        )}

        {/* First Page (if not visible) */}
        {currentPage > 3 && totalPages > 7 && (
          <>
            <a
              href={`${basePath}?page=1`}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              1
            </a>
            {currentPage > 4 && (
              <span className="px-3 py-2 text-sm font-medium text-gray-400">...</span>
            )}
          </>
        )}

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm font-medium text-gray-400">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrentPage = pageNum === currentPage;

          return (
            <a
              key={pageNum}
              href={`${basePath}?page=${pageNum}`}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isCurrentPage
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {pageNum}
            </a>
          );
        })}

        {/* Last Page (if not visible) */}
        {currentPage < totalPages - 2 && totalPages > 7 && (
          <>
            {currentPage < totalPages - 3 && (
              <span className="px-3 py-2 text-sm font-medium text-gray-400">...</span>
            )}
            <a
              href={`${basePath}?page=${totalPages}`}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              {totalPages}
            </a>
          </>
        )}

        {/* Next Button */}
        {hasNextPage ? (
          <a
            href={`${basePath}?page=${currentPage + 1}`}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            Next
          </a>
        ) : (
          <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed">
            Next
          </span>
        )}
      </div>

      {/* Quick Jump */}
      <div className="flex items-center space-x-4 text-sm">
        {currentPage > 1 && (
          <a
            href={`${basePath}?page=1`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← First
          </a>
        )}
        {currentPage < totalPages && (
          <a
            href={`${basePath}?page=${totalPages}`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Last →
          </a>
        )}
      </div>
    </div>
  );
}