import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SheetLens — Document to Google Sheets Scanner",
    short_name: "SheetLens",
    description: "Scan physical documents and instantly append structured rows into Google Spreadsheets.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0D0C",
    theme_color: "#0B0D0C",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
