/**
 * MainLayout - Main application layout wrapper
 */

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}
