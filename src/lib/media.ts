/**
 * Uploaded images are stored as a WebP set produced in the browser (components/admin/MediaPicker.tsx):
 *   …/<folder>/w480.webp, w960.webp, w1600.webp   (the URL saved everywhere is the w1600 one)
 * The site serves them straight from Supabase with a srcset, so they never use Vercel's image optimiser
 * (Hobby: 5,000 transformations a month). See docs/GUARDRAILS.md §4.
 */
export const VARIANT_WIDTHS = [480, 960, 1600] as const;
const MAIN = /\/w1600\.webp(\?.*)?$/;

export const isVariantSet = (src: string | null | undefined): src is string => Boolean(src && MAIN.test(src));
export const variantUrl = (src: string, w: (typeof VARIANT_WIDTHS)[number]) => src.replace(MAIN, `/w${w}.webp$1`);
export const variantSrcSet = (src: string) => VARIANT_WIDTHS.map((w) => `${variantUrl(src, w)} ${w}w`).join(", ");
/** Storage paths of every file in a set (for deletion). */
export const variantPaths = (path: string) => (/\/w1600\.webp$/.test(path) ? VARIANT_WIDTHS.map((w) => path.replace(/w1600\.webp$/, `w${w}.webp`)) : [path]);
/** Any other remote image (pasted URL, legacy upload) is shown as-is rather than transformed. */
export const isRemote = (src: string) => /^https?:\/\//.test(src);
