// Job: Search input atom with search icon and clear button
import React from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  ...props
}) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white border border-border rounded-full pl-9 pr-8 py-2 text-xs text-charcoal placeholder-muted/60 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 p-0.5 text-muted hover:text-charcoal rounded-full"
          title="Clear"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
