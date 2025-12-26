import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-md border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-ayur-500 focus:ring-ayur-500'} shadow-sm px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', id, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full rounded-md border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-ayur-500 focus:ring-ayur-500'} shadow-sm px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};