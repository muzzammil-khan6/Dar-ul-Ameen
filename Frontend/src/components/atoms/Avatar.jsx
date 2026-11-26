// Job: User avatar atom with fallback image and sizing
import React, { memo } from "react";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

function Avatar({
  src,
  alt = "",
  size = "md", // sm | md | lg | xl
  className = "",
}) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <img
      src={src || DEFAULT_AVATAR}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_AVATAR;
      }}
      className={`rounded-full object-cover border border-slate-200 shrink-0 ${sizeMap[size] || sizeMap.md} ${className}`}
    />
  );
}

export default memo(Avatar);
