import { countDisplayedInbox } from "../lib/badge";
import { requiredElement } from "../lib/dom";
import { exportFilename } from "../lib/export-filename";
import { serializeMarkdown } from "../lib/markdown";
import { getMergedDocument } from "../lib/merged-document";
import { clearInbox, ensureLibrary, getInbox, setMarkdown } from "../lib/storage";

const importEl = requiredElement("#import", HTMLInputElement);
const exportEl = requiredElement("#export", HTMLButtonElement);
const clearEl = requiredElement("#clear-inbox", HTMLButtonElement);
const openListEl = requiredElement("#open-list", HTMLAnchorElement);
const countEl = requiredElement("#inbox-count", HTMLElement);
const statusEl = requiredElement("#status", HTMLElement);

openListEl.href = chrome.runtime.getURL("src/browse/index.html");

function setStatus(text: string): void {
  statusEl.textContent = text;
}

async function refreshCount(): Promise<void> {
  const count = await countDisplayedInbox();
  countEl.textContent =
    count === 1 ? "1 item in inbox" : `${count} items in inbox`;
}

importEl.addEventListener("change", () => {
  const file = importEl.files?.[0];
  importEl.value = "";
  if (!file) return;
  void file.text().then(async (text) => {
    await setMarkdown(text);
    setStatus(`Imported ${file.name}`);
  });
});

exportEl.addEventListener("click", () => {
  void (async () => {
    const merged = serializeMarkdown(await getMergedDocument(true));
    const blob = new Blob([merged], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = exportFilename();
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${filename}`);
  })();
});

clearEl.addEventListener("click", () => {
  void (async () => {
    const inbox = await getInbox();
    if (inbox.length === 0) {
      setStatus("Inbox is already empty.");
      return;
    }
    const ok = window.confirm(
      `Delete all ${inbox.length} inbox bookmark(s)? This cannot be undone.`,
    );
    if (!ok) return;
    await clearInbox();
    await refreshCount();
    setStatus("Inbox cleared.");
  })();
});

void ensureLibrary().then(() => refreshCount());
