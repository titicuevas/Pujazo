/**
 * Extrae texto visible útil de la página Biwenger (plantilla / mercado).
 * No envía nada a servidores: solo se usa en el popup vía messaging.
 */

function visibleTextFrom(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
        return NodeFilter.FILTER_REJECT;
      }
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }
      const t = node.textContent?.replace(/\s+/g, " ").trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const lines = [];
  let node = walker.nextNode();
  while (node) {
    const t = node.textContent.replace(/\s+/g, " ").trim();
    if (t) lines.push(t);
    node = walker.nextNode();
  }
  return lines;
}

function guessKind(text) {
  const lower = text.toLowerCase();
  if (/\b(pujar|mercado|libre|ofertas)\b/.test(lower)) return "market";
  if (/\b(vender|plantilla|porteros|defensas|centrocampistas|delanteros)\b/.test(lower)) {
    return "squad";
  }
  return "unknown";
}

function extractFantasyText() {
  const main =
    document.querySelector("main") ||
    document.querySelector("[role='main']") ||
    document.body;

  const lines = visibleTextFrom(main);
  // Quitar ruido extremo de navegación repetida
  const filtered = lines.filter((line) => {
    if (line.length > 180) return false;
    if (/^(cookie|aceptar|rechazar|política)/i.test(line)) return false;
    return true;
  });

  const text = filtered.join("\n").trim();
  return {
    ok: text.length > 40,
    text,
    kind: guessKind(text),
    url: location.href,
    title: document.title,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PUJAZO_EXTRACT") {
    try {
      sendResponse(extractFantasyText());
    } catch (error) {
      sendResponse({
        ok: false,
        text: "",
        kind: "unknown",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }
  return false;
});
