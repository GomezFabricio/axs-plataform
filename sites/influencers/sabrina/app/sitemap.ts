import type { MetadataRoute } from "next";

const URL_SITIO = "https://sabrinabaez.com.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: URL_SITIO,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
