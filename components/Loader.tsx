
import React from 'react';

interface LoaderProps {
  text: string;
}

const Loader: React.FC<LoaderProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 relative">
        <div className="w-4 h-4 bg-pink-500 rounded-full absolute top-0 left-0 animate-ping"></div>
        <div className="w-4 h-4 bg-cyan-400 rounded-full absolute top-0 right-0 animate-ping delay-200"></div>
        <div className="w-4 h-4 bg-green-400 rounded-full absolute bottom-0 left-0 animate-ping delay-400"></div>
        <div className="w-4 h-4 bg-yellow-400 rounded-full absolute bottom-0 right-0 animate-ping delay-600"></div>
      </div>
      <p className="text-xl text-cyan-400 animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;
