// Job: Copy link box molecule combining read-only input + copy button with visual feedback
import React, { useState } from "react";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import { Copy, Check } from "lucide-react";

export default function CopyLinkBox({
  text = "",
  label = "Your Referral / Invite Link",
  buttonText = "Copy",
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <span className="text-xs font-semibold text-slate-700 block">{label}</span>}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          readOnly
          value={text}
          className="bg-slate-50 font-mono text-xs cursor-text"
        />
        <Button
          onClick={handleCopy}
          variant={copied ? "primary" : "secondary"}
          size="md"
          className="shrink-0 min-w-[80px]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{buttonText}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
