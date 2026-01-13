"use client";

import { Copy } from "lucide-react";

interface CopyLinkButtonProps {
  link: string;
}

export function CopyLinkButton({ link }: CopyLinkButtonProps) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(link);
      }}
      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
      title="Copy link"
    >
      <Copy className="w-4 h-4" />
    </button>
  );
}
