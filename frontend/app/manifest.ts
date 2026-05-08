import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Kakeibo",
    short_name: "Kakeibo",
    description: "A digital kakeibo, faithful to mindful money practice.",
    start_url: "/",
    display: "browser",
    background_color: "#faf7f0",
    theme_color: "#1a1a1a",
    lang: "en",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
