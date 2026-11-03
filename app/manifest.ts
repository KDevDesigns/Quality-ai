import type { MetadataRoute } from "next";
import { IMAGE_TYPES, VIDEO_TYPES } from "@/lib/uploads/limits";

// Lets phones and computers install QA Hub as an app. iPhones need this before they allow device notifications.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "QA Hub",
    short_name: "QA Hub",
    description: "DCWD ERP ticket hub",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2233b8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // On solid white with a margin, so Android can crop it to any shape without a white square around a small seal.
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Share → QA Hub on Android, from the installed app: public/sw.js takes the files and opens New ticket.
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: { files: [{ name: "files", accept: [...IMAGE_TYPES, ...VIDEO_TYPES] }] },
    },
  };
}
