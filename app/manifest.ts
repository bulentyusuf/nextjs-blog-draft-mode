import { MetadataRoute } from "next";
import { SITE_TITLE, SITE_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "minimal-ui",
    background_color: "#ffffff",
    theme_color: "##ffffff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
