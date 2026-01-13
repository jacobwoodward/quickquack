"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = "", ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="ml-2 text-sm text-gray-700">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
