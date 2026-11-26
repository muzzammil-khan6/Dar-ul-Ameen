// Job: Form field molecule combining Label + Input + Error text
import React from "react";
import Label from "../atoms/Label";
import Input from "../atoms/Input";

export default function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
  className = "",
  inputClassName = "",
  children, // allows custom input atom
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children || (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          error={Boolean(error)}
          className={inputClassName}
          {...props}
        />
      )}
      {error && <p className="text-[11px] text-rose-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
