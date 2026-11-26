// Job: Search bar molecule combining SearchInput + clear button
import React from "react";
import SearchInput from "../atoms/SearchInput";

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
}) {
  return (
    <div className={`w-full ${className}`}>
      <SearchInput
        value={value}
        onChange={onChange}
        onClear={onClear}
        placeholder={placeholder}
      />
    </div>
  );
}
