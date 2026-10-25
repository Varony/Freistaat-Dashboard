import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} – ${siteConfig.claim}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08090b",
          color: "#eceef1",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #252a32",
              borderRadius: 16,
              background: "#171a20",
              fontSize: 32,
              fontWeight: 600,
            }}
          >
            F
          </div>
          <div style={{ fontSize: 28, color: "#a2a9b3" }}>
            {siteConfig.claim}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: "-0.04em" }}>
            {siteConfig.name}
          </div>
          <div style={{ fontSize: 36, color: "#a2a9b3" }}>
            Wahlen · Gesetze · Bürgerbegehren
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#737b86",
          }}
        >
          <span>{siteConfig.name}</span>
          <span>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
