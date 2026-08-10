const DEFAULT_PUJAZO = "https://pujazo.vercel.app";
const STORAGE_KEY = "pujazoBaseUrl";

const statusEl = document.getElementById("status");
const urlInput = document.getElementById("pujazoUrl");
const btnCopyOpen = document.getElementById("btnCopyOpen");
const btnCopyOnly = document.getElementById("btnCopyOnly");

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || "";
}

function normalizeBaseUrl(raw) {
  const trimmed = (raw || "").trim().replace(/\/$/, "");
  if (!trimmed) return DEFAULT_PUJAZO;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("URL inválida");
    }
    return u.origin;
  } catch {
    return DEFAULT_PUJAZO;
  }
}

async function loadSavedUrl() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  urlInput.value = data[STORAGE_KEY] || DEFAULT_PUJAZO;
}

async function saveUrl() {
  const base = normalizeBaseUrl(urlInput.value);
  urlInput.value = base;
  await chrome.storage.sync.set({ [STORAGE_KEY]: base });
  return base;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isBiwengerUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return (
      host === "biwenger.as.com" ||
      host === "biwenger.com" ||
      host.endsWith(".biwenger.com")
    );
  } catch {
    return false;
  }
}

async function extractFromTab(tab) {
  if (!tab?.id) throw new Error("No hay pestaña activa.");
  if (!isBiwengerUrl(tab.url)) {
    throw new Error(
      "Abre Biwenger web (biwenger.as.com) en Plantilla o Mercado y vuelve a intentarlo.",
    );
  }

  let response;
  try {
    response = await chrome.tabs.sendMessage(tab.id, { type: "PUJAZO_EXTRACT" });
  } catch {
    // Content script aún no inyectado (p. ej. pestaña abierta antes de instalar)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    response = await chrome.tabs.sendMessage(tab.id, { type: "PUJAZO_EXTRACT" });
  }

  if (!response?.ok || !response.text) {
    throw new Error(
      response?.error ||
        "No encontré texto útil. Abre la vista de plantilla o mercado y espera a que cargue.",
    );
  }
  return response;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Fallback MV3
  }
  const ok = await chrome.scripting.executeScript({
    target: { tabId: (await getActiveTab()).id },
    func: async (value) => {
      await navigator.clipboard.writeText(value);
    },
    args: [text],
  });
  if (!ok) throw new Error("No se pudo copiar al portapapeles.");
}

async function run({ openPujazo }) {
  btnCopyOpen.disabled = true;
  btnCopyOnly.disabled = true;
  setStatus("Extrayendo…");
  try {
    const base = await saveUrl();
    const tab = await getActiveTab();
    const extracted = await extractFromTab(tab);
    await copyText(extracted.text);

    const kindHint =
      extracted.kind === "market"
        ? "Parece mercado."
        : extracted.kind === "squad"
          ? "Parece plantilla."
          : "Texto copiado.";

    if (openPujazo) {
      const target = `${base}/analizar?pegar=1&clip=1`;
      await chrome.tabs.create({ url: target });
      setStatus(`${kindHint} Abriendo Pujazo para pegar solo.`, "ok");
    } else {
      setStatus(
        `${kindHint} ${extracted.text.length} caracteres en el portapapeles.`,
        "ok",
      );
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "err");
  } finally {
    btnCopyOpen.disabled = false;
    btnCopyOnly.disabled = false;
  }
}

btnCopyOpen.addEventListener("click", () => void run({ openPujazo: true }));
btnCopyOnly.addEventListener("click", () => void run({ openPujazo: false }));
urlInput.addEventListener("change", () => {
  void saveUrl().then((base) => {
    setStatus(`URL guardada: ${base}`, "ok");
  });
});
void loadSavedUrl();
