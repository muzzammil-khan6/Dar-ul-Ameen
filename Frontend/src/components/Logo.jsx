import React, { memo } from "react";

/**
 * Dar-ul-Ameen Official Logo Component
 * Variants:
 *  - "full": Teal Icon + darulameen typography (/logos/logo-full-transparent.png)
 *  - "horizontal": Horizontal logo (/logos/logo-horizontal-transparent.png)
 *  - "icon": White Icon only, transparent (/logos/logo-icon-transparent.png)
 */
function Logo({
  variant = "horizontal",
  className = "",
  alt = "Dar-ul-Ameen",
  ...props
}) {
  const logoMap = {
    full: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/logo-full-transparent_IzYCm2xNh7.png",
    horizontal: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/logo-horizontal-transparent_EFypsl_lm.png",
    icon: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/logo-icon-transparent_w5m-GEK7MP.png",
  };

  const src = logoMap[variant] || logoMap.horizontal;

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
}

export default memo(Logo);
