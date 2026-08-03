import { ImageResponse } from "next/og";
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
          padding: 72,
          background: "linear-gradient(135deg, #0b1f17 0%, #143528 55%, #0b1f17 100%)",
          color: "#eef8b8",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#9fd400",
            letterSpacing: -2,
          }}
        >
          Pujazo
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 900,
            color: "#f3ffe0",
          }}
        >
          Tu plantilla. Tu mercado. Tu próximo movimiento.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: "#b7c9bc",
            maxWidth: 820,
          }}
        >
          Plan de fichajes, pujas y alineación — sin conectar cuentas.
        </div>
      </div>
    ),
    { ...size },
  );
}
