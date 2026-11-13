"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Share row: native share sheet on phones, then LinkedIn, X, Facebook, WhatsApp, email and copy link. No trackers. */
export function ShareButtons({ url, title, labels }: { url: string; title: string; labels: { share: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);
  const u = encodeURIComponent(url);
  const tx = encodeURIComponent(title);
  const links: [string, string, string][] = [
    ["LinkedIn", "linkedin", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["X", "x", `https://x.com/intent/post?url=${u}&text=${tx}`],
    ["Facebook", "facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ["WhatsApp", "whatsapp", `https://wa.me/?text=${tx}%20${u}`],
    ["Email", "mail", `mailto:?subject=${tx}&body=${u}`],
  ];
  const native = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="share-row" role="group" aria-label={labels.share}>
      {canShare && (
        <button type="button" className="share-btn sm:hidden" onClick={native} aria-label={labels.share}>
          <Icon name="external" size={16} />
        </button>
      )}
      {links.map(([name, icon, href]) => (
        <a key={name} className="share-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>
          <Icon name={icon} size={16} />
        </a>
      ))}
      <button
        type="button"
        className="share-btn !w-auto px-3 text-xs font-semibold"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
}
