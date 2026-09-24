import { ImageResponse } from "next/og";
import { BRAND_EN } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#ffffff",
          color: "#111111",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "#ff7802",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          M
        </div>
        <div style={{ marginTop: 36, fontSize: 72, fontWeight: 700 }}>{BRAND_EN}</div>
        <div style={{ marginTop: 12, fontSize: 32, color: "#555555" }}>Booking in Iraq</div>
      </div>
    ),
    size,
  );
}
