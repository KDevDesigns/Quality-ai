import type { MetadataRoute } from "next";

// Lets phones install QA Hub to the home screen. iPhones need this before they allow device notifications.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QA Hub",
    short_name: "QA Hub",
    description: "DCWD ERP ticket hub",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [{ src: "/dcwd-seal.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
