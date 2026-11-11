/** Localized value: one entry per language code (languages are data, so keys are open). */
export type L<T = string> = Record<string, T>;

/** ProseMirror / TipTap JSON document (the rich-text storage format everywhere). */
export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};
export type RichDoc = { type: "doc"; content: RichNode[] };

export type Role = "owner" | "admin" | "editor" | "viewer";

export type Language = {
  code: string;
  name: string; // English name
  native_name: string;
  dir: "ltr" | "rtl";
  enabled: boolean;
  is_default: boolean;
  sort: number;
};

export type Numerals = "latn" | "arab";

export type SiteSettings = {
  brand: {
    short_name: string;
    name: L;
    legal_name: L;
    tagline: L;
    founded_year: number;
    logo_light: string | null; // media path or URL; null = built-in SVG mark
    logo_dark: string | null;
    favicon: string | null;
  };
  contact: {
    email: string;
    phones: string[]; // E.164
    landlines: string[];
    whatsapp: string;
    notify_email: string;
  };
  social: { platform: string; url: string; enabled: boolean }[];
  seo: {
    title_template: L; // e.g. "%s · SCO"
    default_title: L;
    default_description: L;
    og_image: string | null;
    verification: { google?: string; bing?: string; yandex?: string };
  };
  theme: {
    default_mode: "system" | "light" | "dark";
    numerals_ar: Numerals;
    preset: "ledger" | "gold";
    hero_3d: boolean;
    /** Brand colours override the preset when set (hex). */
    custom_colors?: { enabled: boolean; primary: string; accent: string };
    /** full = all motion, subtle = no scroll scenes/tilt, off = static site. */
    motion?: "full" | "subtle" | "off";
    intro?: boolean;
    background_glow?: boolean;
    smooth_scroll?: boolean;
  };
  /** Images used by built-in parts of the design (not by a block or collection). */
  images?: { founder_cutout: string; video_poster: string; organization: string; logo_schema: string };
  header: {
    show_announcement: boolean;
    announcement: L;
    announcement_url: string;
    show_phone: boolean;
    show_theme_toggle: boolean;
    show_language_switcher: boolean;
    show_cta: boolean;
    cta_label: L;
    cta_url: string;
  };
  footer: {
    show_services: boolean;
    show_contact: boolean;
    show_social: boolean;
    show_newsletter: boolean;
    show_map: boolean;
    about: L;
    copyright: L;
  };
  floating: { whatsapp: boolean; call: boolean };
  stats: {
    visible: boolean;
    items: { key: string; value: number | null; label: L; suffix?: string; auto_years?: boolean }[];
  };
};

export type TrackingSettings = {
  ga4_id: string;
  gtm_id: string;
  google_ads_id: string;
  google_ads_lead_label: string;
  meta_pixel_id: string;
  meta_capi_enabled: boolean;
  clarity_id: string;
  linkedin_partner_id: string;
  tiktok_pixel_id: string;
  custom_head: string;
  custom_body: string;
};

export type Service = {
  id?: string;
  slug: string;
  sort: number;
  published: boolean;
  icon: string; // key into the icon set
  image: string | null;
  name: L;
  summary: L;
  intro: L;
  body: L<RichDoc>;
  highlights: L<string[]>;
  seo: L<{ title?: string; description?: string }>;
  legacy_slug?: string;
};

export type TeamMember = {
  id?: string;
  slug: string;
  sort: number;
  published: boolean;
  name: L;
  role: L;
  credentials: L<string[]>;
  bio: L<RichDoc>;
  photo: string | null;
  has_profile: boolean;
};

export type ClientKind = "corporate" | "donor" | "ngo";
export type Client = {
  id?: string;
  kind: ClientKind;
  sort: number;
  published: boolean;
  featured: boolean; // show in home marquee
  name: L;
  logo: string | null;
  url: string | null;
};

export type Certificate = {
  id?: string;
  sort: number;
  published: boolean;
  title: L;
  issuer: L;
  reference: string | null;
  year: number | null;
  image: string | null;
};

export type Branch = {
  id?: string;
  sort: number;
  published: boolean;
  is_primary: boolean;
  name: L;
  address: L;
  landmark: L;
  phones: string[];
  email: string | null;
  hours: L;
  lat: number | null;
  lng: number | null;
};

export type Faq = {
  id?: string;
  group_key: string;
  sort: number;
  published: boolean;
  question: L;
  answer: L<RichDoc>;
  legal_basis: L | null;
  reviewed_at: string | null;
};

export type GalleryItem = {
  id?: string;
  sort: number;
  published: boolean;
  image: string;
  caption: L;
  width: number;
  height: number;
};

export type Block = { id: string; type: string; props: Record<string, unknown>; hidden?: boolean };

export type Page = {
  id?: string;
  slug: string; // "" = home
  kind: "system" | "custom";
  published: boolean;
  title: L;
  seo: L<{ title?: string; description?: string; og_image?: string }>;
  blocks: Block[];
};

export type Post = {
  id?: string;
  slug: L;
  status: "draft" | "scheduled" | "published";
  publish_at: string | null;
  title: L;
  excerpt: L;
  body: L<RichDoc>;
  cover: string | null;
  cover_alt: L;
  category_id: string | null;
  tag_ids: string[];
  author_id: string | null;
  seo: L<{ title?: string; description?: string; focus_keyword?: string }>;
  faqs: L<{ q: string; a: string }[]>;
  source_hash: string | null;
  translation_status: L<"current" | "outdated" | "missing">;
  updated_at?: string;
};

export type MenuItem = { id: string; label: L; href: string; children?: MenuItem[] };
export type Menu = { location: "header" | "footer"; items: MenuItem[] };
