/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { isRemote, isVariantSet, variantSrcSet } from "@/lib/media";

type Props = { src: string; alt: string; sizes?: string; className?: string; priority?: boolean; quality?: 75 | 92 } & ({ fill: true; width?: never; height?: never } | { fill?: false; width: number; height: number });

/**
 * Drop-in for next/image that keeps Vercel image transformations near zero:
 *  - uploaded WebP sets → plain <img> with srcset straight from Supabase (no optimiser),
 *  - other remote URLs → shown unoptimised,
 *  - bundled /legacy files → next/image (a bounded, one-off set of transformations).
 */
export function SmartImage(p: Props) {
  const { src, alt, sizes, className = "", priority, quality } = p;
  if (isVariantSet(src) || isRemote(src)) {
    const common = {
      src,
      alt,
      sizes,
      srcSet: isVariantSet(src) ? variantSrcSet(src) : undefined,
      loading: priority ? ("eager" as const) : ("lazy" as const),
      fetchPriority: priority ? ("high" as const) : undefined,
      decoding: "async" as const,
    };
    return p.fill ? (
      <img {...common} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
    ) : (
      <img {...common} alt={alt} width={p.width} height={p.height} className={className} />
    );
  }
  return p.fill ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={quality} className={className} /> : <Image src={src} alt={alt} width={p.width} height={p.height} sizes={sizes} priority={priority} quality={quality} className={className} />;
}
