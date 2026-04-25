import { useEffect } from "react";

interface OGTagsOptions {
  title: string;
  description: string;
  image: string;
  url?: string;
  price?: number;
  currency?: string;
  availability?: "in stock" | "out of stock" | "preorder";
  siteName?: string;
  twitterHandle?: string;
}

function setMeta(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector(
    `meta[${attr}="${property}"]`,
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * useOGTags
 *
 * Dynamically injects all required Open Graph, Twitter Card, and product
 * structured-data meta tags needed for rich previews on:
 *   - Facebook (og:*)
 *   - Instagram (reads og:* from the shared URL)
 *   - Twitter / X (twitter:*)
 *   - WhatsApp, Telegram, iMessage (og:*)
 *   - Pinterest (og:* + article:*)
 *   - Google (JSON-LD Product schema)
 *
 * Usage:
 *   useOGTags({ title: product.title, description: product.description, image: images[0], ... })
 */
export function useOGTags({
  title,
  description,
  image,
  url,
  price,
  currency = "NPR",
  availability = "in stock",
  siteName = "Yarnly",
  twitterHandle = "@yarnly",
}: OGTagsOptions) {
  useEffect(() => {
    const pageUrl = url ?? window.location.href;
    const fullTitle = `${title} – ${siteName}`;

    // ── Document title ────────────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Canonical ─────────────────────────────────────────────────────────────
    setLink("canonical", pageUrl);

    // ── Basic meta ────────────────────────────────────────────────────────────
    setMeta("description", description, true);

    // ── Open Graph (Facebook, Instagram, WhatsApp, Telegram) ─────────────────
    setMeta("og:type", "product");
    setMeta("og:site_name", siteName);
    setMeta("og:title", fullTitle);
    setMeta("og:description", description);
    setMeta("og:url", pageUrl);
    setMeta("og:image", image);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "1200");
    setMeta("og:image:type", "image/jpeg");
    setMeta("og:image:alt", title);

    // ── Facebook / Instagram app id (replace with your FB App ID) ─────────────
    // setMeta("fb:app_id", "YOUR_FACEBOOK_APP_ID");

    // ── Product-specific OG tags (Facebook Shops, Instagram Shopping) ─────────
    if (price !== undefined) {
      setMeta("product:price:amount", price.toFixed(2));
      setMeta("product:price:currency", currency);
    }
    setMeta("product:availability", availability);
    setMeta("product:condition", "new");

    // ── Twitter / X Card ──────────────────────────────────────────────────────
    setMeta("twitter:card", "summary_large_image", true);
    setMeta("twitter:site", twitterHandle, true);
    setMeta("twitter:creator", twitterHandle, true);
    setMeta("twitter:title", fullTitle, true);
    setMeta("twitter:description", description, true);
    setMeta("twitter:image", image, true);
    setMeta("twitter:image:alt", title, true);

    // ── Schema.org JSON-LD (Google rich results, Pinterest) ───────────────────
    const schemaId = "product-jsonld";
    let script = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: title,
      description,
      image: [image],
      url: pageUrl,
      brand: { "@type": "Brand", name: siteName },
      offers:
        price !== undefined
          ? {
              "@type": "Offer",
              priceCurrency: currency,
              price: price.toFixed(2),
              availability:
                availability === "in stock"
                  ? "https://schema.org/InStock"
                  : availability === "preorder"
                    ? "https://schema.org/PreOrder"
                    : "https://schema.org/OutOfStock",
              url: pageUrl,
            }
          : undefined,
    });

    // ── Cleanup: restore title only (tags persist for next page via SPA nav) ──
    return () => {
      document.title = siteName;
    };
  }, [
    title,
    description,
    image,
    url,
    price,
    currency,
    availability,
    siteName,
    twitterHandle,
  ]);
}
