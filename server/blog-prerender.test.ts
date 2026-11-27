import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { blogPublicMetadata } from "@shared/blog-public-metadata";
import type { BlogPost } from "@shared/schema";

const { getBlogPostBySlug, getAllBlogPosts } = vi.hoisted(() => ({
  getBlogPostBySlug: vi.fn(), getAllBlogPosts: vi.fn(),
}));
vi.mock("./storage", () => ({ storage: { getBlogPostBySlug, getAllBlogPosts } }));
import { injectBlogPrerender } from "./blog-prerender";
import { buildLlmsFullTxt } from "./llms-full";

const template = readFileSync("client/index.html", "utf8");
const post: BlogPost = {
  id: 1, title: 'Speaking & "Listening"', slug: "speaking-listening",
  excerpt: "Activities for confident speakers.", content: '<h2>Teaching tips</h2><p>Try pairs &amp; groups. $&</p><script>alert(1)</script>',
  author: "Teacher", publishDate: "2026-10-01", category: "Teaching",
  tags: ["Speaking"], readTime: "5 min", featured: false,
  featuredImageUrl: "/images/blog-speaking.jpg", featuredImageAlt: 'Pairs & "groups"',
  metaTitle: null, metaDescription: null, publishedAt: null, isPublished: true,
  createdAt: new Date("2026-10-01"), updatedAt: new Date("2026-10-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
  getBlogPostBySlug.mockResolvedValue(post);
  getAllBlogPosts.mockResolvedValue({ posts: [post] });
});

function parse(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}
function assertMetadata(html: string, expectedPost = post) {
  const doc = parse(html);
  const metadata = blogPublicMetadata(expectedPost);
  const singleMeta = (key: string, value: string) => {
    const tags = doc.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`);
    expect(tags).toHaveLength(1);
    expect(tags[0].getAttribute("content")).toBe(value);
  };
  expect(doc.querySelectorAll("title")).toHaveLength(1);
  expect(doc.title).toBe(metadata.title);
  singleMeta("description", metadata.description);
  singleMeta("og:title", metadata.title);
  singleMeta("twitter:title", metadata.title);
  singleMeta("og:description", metadata.description);
  singleMeta("twitter:description", metadata.description);
  const url = `https://planwiseesl.com${metadata.canonicalPath}`;
  singleMeta("og:url", url);
  singleMeta("twitter:url", url);
  singleMeta("og:type", "article");
  singleMeta("twitter:card", "summary_large_image");
  singleMeta("og:image", metadata.imageUrl);
  singleMeta("twitter:image", metadata.imageUrl);
  singleMeta("og:image:alt", metadata.imageAlt);
  singleMeta("twitter:image:alt", metadata.imageAlt);
  expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(url);
  for (const key of ["width", "height", "type", "secure_url"]) {
    expect(doc.querySelector(`meta[property="og:image:${key}"]`)).toBeNull();
  }
  expect(html).not.toContain("Create CEFR leveled ESL lessons on any topic");
  expect(doc.querySelector('#root article h1')?.textContent).toBe(expectedPost.title);
  expect(doc.querySelector('#root script')).toBeNull();
  expect(doc.querySelector('#root')?.textContent).toContain("Try pairs & groups. $&");
  expect(doc.querySelector('script[src="/src/main.tsx"]')).not.toBeNull();
}

describe("blog social previews using the real client template", () => {
  it("replaces homepage tags with exactly one article-specific set before JavaScript", async () => {
    assertMetadata((await injectBlogPrerender(template, "/blog/speaking-listening"))!);
  });

  it("honors custom metadata and external featured images, escaping attribute text", async () => {
    const custom = {
      ...post, metaTitle: 'Custom <title> & "$&"', metaDescription: 'Tips <safe> & "helpful"',
      featuredImageUrl: "https://cdn.example.com/photo.webp?a=1&b=2"
    };
    getBlogPostBySlug.mockResolvedValue(custom);
    assertMetadata((await injectBlogPrerender(template, `/blog/${post.slug}`))!, custom);
  });

  it("removes stale duplicate canonical, description and social tags", async () => {
    const duplicate = template.replace("</head>", `<meta name="description" content="old">
      <meta name="robots" content="noindex"><link rel="canonical" href="https://example.com">
      <meta property="og:url" content="https://example.com">
      <meta property="og:image:secure_url" content="https://example.com/image"></head>`);
    assertMetadata((await injectBlogPrerender(duplicate, `/blog/${post.slug}`))!);
  });

  it.each([null, "", "javascript:alert(1)", "data:image/png;base64,abc", "http://["])(
    "uses the default image safely when the stored value is %s", async (featuredImageUrl) => {
      const noImage = { ...post, featuredImageUrl, featuredImageAlt: null };
      getBlogPostBySlug.mockResolvedValue(noImage);
      const html = (await injectBlogPrerender(template, `/blog/${post.slug}`))!;
      assertMetadata(html, noImage);
      const doc = parse(html);
      for (const key of ["og:image", "twitter:image"]) {
        expect(doc.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.getAttribute("content"))
          .toBe("https://planwiseesl.com/images/homepage-share-2026-10.png");
      }
      expect(html).not.toContain("/images/twitter-card-new-design.png");
    },
  );

  it("normalizes relative image URLs and truncates long excerpts consistently", async () => {
    const relative = { ...post, featuredImageUrl: "images/photo.jpg", excerpt: "A".repeat(200) };
    getBlogPostBySlug.mockResolvedValue(relative);
    assertMetadata((await injectBlogPrerender(template, `/blog/${post.slug}/`))!, relative);
    expect(blogPublicMetadata(relative).imageUrl).toBe("https://planwiseesl.com/images/photo.jpg");
    expect(blogPublicMetadata(relative).description).toHaveLength(160);
  });

  it("reuses a matching published post without another database call", async () => {
    assertMetadata((await injectBlogPrerender(template, `/blog/${post.slug}`, post))!);
    expect(getBlogPostBySlug).not.toHaveBeenCalled();
  });

  it("does not trust preloaded data for a different slug", async () => {
    await injectBlogPrerender(template, `/blog/${post.slug}`, { ...post, slug: "other" });
    expect(getBlogPostBySlug).toHaveBeenCalledWith(post.slug);
  });

  it("does not expose drafts, even when preloaded", async () => {
    getBlogPostBySlug.mockResolvedValue({ ...post, isPublished: false });
    expect(await injectBlogPrerender(template, `/blog/${post.slug}`)).toBeNull();
    expect(await injectBlogPrerender(template, `/blog/${post.slug}`, { ...post, isPublished: false })).toBeNull();
  });

  it("returns no article HTML for missing posts and database errors", async () => {
    getBlogPostBySlug.mockResolvedValue(undefined);
    expect(await injectBlogPrerender(template, "/blog/missing")).toBeNull();
    getBlogPostBySlug.mockRejectedValue(new Error("unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => { });
    try {
      expect(await injectBlogPrerender(template, `/blog/${post.slug}`)).toBeNull();
    } finally { error.mockRestore(); }
  });

  it("preserves blog index rendering and does not touch unrelated pages", async () => {
    const html = (await injectBlogPrerender(template, "/blog"))!;
    expect(html).toContain("ESL Teaching Blog");
    expect(html).toContain(`/blog/${post.slug}`);
    expect(getAllBlogPosts).toHaveBeenCalledWith(1, 100, undefined, undefined, true);
    expect(await injectBlogPrerender(template, "/blog/nested/path")).toBeNull();
    expect(await injectBlogPrerender(template, "/auth")).toBeNull();
  });

  it("preserves AI-readable HTML tables, emits BreadcrumbList JSON-LD, and includes posts in /llms-full.txt", async () => {
    const tablePost: BlogPost = {
      ...post,
      content: '<table><thead><tr><th scope="col">Level</th><th scope="col">Words</th></tr></thead><tbody><tr><td>A1</td><td>80-120</td></tr></tbody></table>',
    };
    getBlogPostBySlug.mockResolvedValue(tablePost);
    const html = (await injectBlogPrerender(template, `/blog/${post.slug}`))!;
    const doc = parse(html);
    expect(doc.querySelector("#root table thead th")?.getAttribute("scope")).toBe("col");
    const tds = [...doc.querySelectorAll("#root table tbody td")].map((td) => td.textContent);
    expect(tds).toEqual(["A1", "80-120"]);
    const ldBlocks = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(ldBlocks.some((b) => b["@type"] === "BlogPosting")).toBe(true);
    expect(ldBlocks.some((b) => b["@type"] === "BreadcrumbList")).toBe(true);

    const llmsFull = buildLlmsFullTxt([], [post]);
    expect(llmsFull).toContain("## ESL Teaching Blog");
    expect(llmsFull).toContain(`https://planwiseesl.com/blog/${post.slug}`);
    expect(llmsFull).toContain(post.excerpt);
  });

  it("emits FAQPage JSON-LD only when a post has an FAQ section with 2+ questions", async () => {
    const faqPost: BlogPost = {
      ...post,
      content: '<p>Intro.</p><h2>Frequently Asked Questions</h2><h3>Q1 &amp; details?</h3><p>Answer <strong>one</strong>.</p><h3>Q2?</h3><p>Answer two &mdash; concise.</p><h2>Next</h2><p>Ignored</p>',
    };
    getBlogPostBySlug.mockResolvedValue(faqPost);
    const faqHtml = (await injectBlogPrerender(template, `/blog/${post.slug}`))!;
    const faqDoc = parse(faqHtml);
    const faqScript = faqDoc.querySelector('#seo-faq-jsonld');
    expect(faqScript).not.toBeNull();
    const faqJson = JSON.parse(faqScript!.textContent!);
    expect(faqJson["@type"]).toBe("FAQPage");
    expect(faqJson.mainEntity).toEqual([
      { "@type": "Question", name: "Q1 & details?", acceptedAnswer: { "@type": "Answer", text: "Answer one." } },
      { "@type": "Question", name: "Q2?", acceptedAnswer: { "@type": "Answer", text: "Answer two — concise." } },
    ]);

    getBlogPostBySlug.mockResolvedValue(post);
    const plainHtml = (await injectBlogPrerender(template, `/blog/${post.slug}`))!;
    const plainDoc = parse(plainHtml);
    expect(plainDoc.querySelector('#seo-faq-jsonld')).toBeNull();
  });
});
