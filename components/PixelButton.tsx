
import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
}

const PixelButton: React.FC<PixelButtonProps> = ({ children, active = false, icon, ...props }) => {
  const activeClasses = "bg-pink-500 text-black shadow-[2px_2px_0px_#0ff] -translate-x-0.5 -translate-y-0.5";
  const inactiveClasses = "bg-gray-800 text-cyan-400 hover:border-pink-500 hover:shadow-[4px_4px_0px_#f0f] active:translate-x-1 active:translate-y-1 active:shadow-none";

  return (
    <button
      {...props}
      className={`p-2 border-2 border-gray-600 rounded-md font-sans text-sm md:text-base transition-all duration-150 ease-in-out transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${active ? activeClasses : inactiveClasses}`}
    >
      {icon}
      {children}
    </button>
  );
};

export default PixelButton;
