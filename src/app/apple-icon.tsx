import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icono Apple Touch / PWA a partir de la marca Pujazo. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1c14",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            marginTop: 8,
          }}
        >
          <div
            style={{
              color: "#9fd400",
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1,
              fontFamily: "Arial Black, Arial, sans-serif",
              letterSpacing: -4,
            }}
          >
            P
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "18px solid transparent",
              borderRight: "18px solid transparent",
              borderBottom: "36px solid #eef8b8",
              marginBottom: 22,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
