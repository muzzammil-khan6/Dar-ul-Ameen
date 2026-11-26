// Job: Profile picture atom with border and rounded styling
import React from "react";
import Avatar from "./Avatar";

export default function ProfilePic({ src, alt = "Profile", size = "lg", className = "" }) {
  return <Avatar src={src} alt={alt} size={size} className={`shadow-sm ${className}`} />;
}
