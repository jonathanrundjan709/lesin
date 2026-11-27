import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Lesin", short_name: "Lesin", description: "Cari guru les privat dekat rumah", start_url: "/", display: "standalone", background_color: "#fbf7ef", theme_color: "#17705a", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
