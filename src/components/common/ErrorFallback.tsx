/**
 * Error Fallback - Displayed when an error is caught by ErrorBoundary
 */

// Error fallback components

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError?: () => void;
}

export function ErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>

        <p className="text-sm text-red-600 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>

        {isDev && errorInfo && (
          <details className="mb-4 text-left">
            <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">
              Show stack trace
            </summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40 text-red-800">
              {error.stack}
              {'\n\nComponent Stack:\n'}
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-center">
          {resetError && (
            <button
              onClick={resetError}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline errors
export function ErrorFallbackCompact({
  error,
  resetError,
}: {
  error: Error;
  resetError?: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">Error loading component</p>
          <p className="text-xs text-red-600 mt-1 truncate">{error.message}</p>
        </div>
        {resetError && (
          <button
            onClick={resetError}
            className="text-xs text-red-600 hover:text-red-800 underline flex-shrink-0"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
