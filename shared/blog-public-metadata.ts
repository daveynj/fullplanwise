import type { BlogPost } from "./schema";

const BASE_URL = "https://planwiseesl.com";
const DEFAULT_IMAGE = `${BASE_URL}/images/twitter-card-new-design.png`;

/** Identical metadata for crawler HTML and client-side navigation. */
export function blogPublicMetadata(post: Pick<BlogPost,
  "title" | "slug" | "excerpt" | "metaTitle" | "metaDescription" | "featuredImageUrl" | "featuredImageAlt"
>) {
  const description = post.metaDescription || post.excerpt;
  let imageUrl = DEFAULT_IMAGE;
  try {
    const url = new URL(post.featuredImageUrl || DEFAULT_IMAGE, `${BASE_URL}/`);
    if (url.protocol === "http:" || url.protocol === "https:") imageUrl = url.href;
  } catch {
    // An invalid stored image must not produce an unsafe social preview URL.
  }
  return {
    title: post.metaTitle || `${post.title} | Plan Wise ESL Blog`,
    description: description.length > 160 ? description.substring(0, 157) + "..." : description,
    canonicalPath: `/blog/${encodeURIComponent(post.slug)}`,
    imageUrl,
    imageAlt: post.featuredImageAlt || post.title,
  };
}
