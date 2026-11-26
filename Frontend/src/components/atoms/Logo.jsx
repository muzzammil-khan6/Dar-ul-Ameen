import React, { memo } from "react";
import BaseLogo from "../Logo";

/**
 * Atomic Logo wrapper ensuring backward compatibility with any legacy atom imports
 */
function Logo({ variant = "horizontal", size, showTagline, className = "", ...props }) {
  let mappedVariant = variant;
  if (variant === "light") mappedVariant = "icon";
  else if (variant === "dark") mappedVariant = "horizontal";

  return <BaseLogo variant={mappedVariant} className={className} {...props} />;
}

export default memo(Logo);
