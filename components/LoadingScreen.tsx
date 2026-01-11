import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-gray-900 rounded-full animate-spin"></div>
        <div className="absolute inset-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
           <span className="text-2xl grayscale">🤖</span>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-2 font-mono">Processing...</h2>
      <div className="w-64 space-y-2">
        <div className="h-1 w-full bg-gray-100 rounded overflow-hidden">
          <div className="h-full bg-gray-900 animate-[translateX_1.5s_ease-in-out_infinite] w-1/2 rounded origin-left"></div>
        </div>
        <p className="text-center text-xs text-gray-500 font-mono whitespace-nowrap">
          Parsing commits & generating summary
        </p>
      </div>
    </div>
  );
};