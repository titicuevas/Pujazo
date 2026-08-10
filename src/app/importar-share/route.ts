import { NextResponse } from "next/server";

export const runtime = "nodejs";

function collectSharePayload(input: {
  title?: string | null;
  text?: string | null;
  url?: string | null;
}): string {
  const parts = [input.title, input.text, input.url]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
  // Prefer the longest chunk (el share de Biwenger suele ir en `text`)
  if (parts.length === 0) return "";
  return parts.sort((a, b) => b.length - a.length)[0] ?? "";
}

function redirectHtml(text: string): NextResponse {
  const payload = JSON.stringify(text);
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Importando en Pujazo…</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#06140f;color:#e8f5ef;display:grid;place-items:center;min-height:100vh;margin:0}
    p{opacity:.85}
  </style>
</head>
<body>
  <p>Recibiendo el texto compartido…</p>
  <script>
    (function () {
      try {
        var text = ${payload};
        if (text && text.trim()) {
          sessionStorage.setItem("pujazo.pendingShareText.v1", text.trim());
        }
      } catch (e) {}
      location.replace("/analizar?pegar=1&share=1");
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Android / Chrome: GET share_target con query params. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = collectSharePayload({
    title: url.searchParams.get("title"),
    text: url.searchParams.get("text"),
    url: url.searchParams.get("url"),
  });
  return redirectHtml(text);
}

/** Preferido: POST multipart (textos largos de plantilla/mercado). */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let title: string | null = null;
  let text: string | null = null;
  let shareUrl: string | null = null;

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    title = String(form.get("title") ?? "");
    text = String(form.get("text") ?? "");
    shareUrl = String(form.get("url") ?? "");
  } else {
    // fallback query
    const url = new URL(request.url);
    title = url.searchParams.get("title");
    text = url.searchParams.get("text");
    shareUrl = url.searchParams.get("url");
  }

  return redirectHtml(
    collectSharePayload({ title, text, url: shareUrl }),
  );
}
