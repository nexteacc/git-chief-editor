import React from 'react';
import { Loader } from '@/components/ui/loader';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans">
      <Loader />

      <div className="mt-12 text-center text-xs text-gray-500 font-mono whitespace-nowrap">
        Parsing commits & generating summary
      </div>
    </div>
  );
};