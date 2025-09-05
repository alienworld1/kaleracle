'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'glass';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      className = '',
      type = 'text',
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'w-full rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default:
        'bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-red-500 focus:bg-white/8',
      glass:
        'bg-white/10 backdrop-blur-xl border border-white/15 text-white placeholder-gray-300 focus:border-red-500 focus:bg-white/15',
    };

    const sizeClasses = 'px-4 py-3 text-base';
    const errorClasses = error ? 'border-red-500 focus:border-red-500' : '';

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${errorClasses} ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input ref={ref} type={type} className={combinedClasses} {...props} />
          {type === 'number' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              {props.max && typeof props.value === 'string' && props.value
                ? `/ ${props.max}`
                : ''}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
