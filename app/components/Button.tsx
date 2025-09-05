'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-500/30 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-gray-800/80 backdrop-blur-xl text-white border border-white/10 hover:border-red-500/30 hover:bg-gray-700/80',
    glass:
      'bg-white/10 backdrop-blur-xl text-white border border-white/15 hover:bg-white/15 hover:border-red-500/30',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
