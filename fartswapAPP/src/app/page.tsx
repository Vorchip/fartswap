'use client';

import SwapInterface from '@/components/SwapInterface';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4">
        <SwapInterface />
      </div>
    </main>
  );
}
