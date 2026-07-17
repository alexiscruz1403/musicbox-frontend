import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vinlyst",
    short_name: "Vinlyst",
    description: "Una red social de reseñas musicales",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#0A0A0F",
    lang: "es",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
