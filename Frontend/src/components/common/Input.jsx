import React from "react";

export default function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = "",
  helperText,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-charcoal mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3.5 py-2 bg-white border rounded-lg text-sm text-charcoal placeholder-muted/60 transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-sage/40 disabled:text-muted disabled:cursor-not-allowed ${
          error ? "border-red-500 ring-1 ring-red-500" : "border-border"
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helperText && (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}
