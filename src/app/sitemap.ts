import type { MetadataRoute } from "next";

// Dynamic property URLs come from the backend API (separate repo). This
// sitemap lists the static public routes only until the API is wired up.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://rentalhub.ng",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://rentalhub.ng/properties",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
