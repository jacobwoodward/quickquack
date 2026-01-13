"use client";

import { ReactNode } from "react";

interface AlertProps {
  variant?: "error" | "success" | "warning" | "info";
  children: ReactNode;
  className?: string;
}

const variants = {
  error: "bg-red-50 text-red-700 border-red-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export function Alert({ variant = "error", children, className = "" }: AlertProps) {
  return (
    <div
      className={`p-3 rounded-lg text-sm border ${variants[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
