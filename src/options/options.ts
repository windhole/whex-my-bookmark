import { requiredElement } from "../lib/dom";
import { mergeInbox, parseMarkdown, serializeMarkdown } from "../lib/markdown";
import { clearInbox, getInbox, getMarkdown, setMarkdown } from "../lib/storage";

const importEl = requiredElement("#import", HTMLInputElement);
const exportEl = requiredElement("#export", HTMLButtonElement);
const clearEl = requiredElement("#clear-inbox", HTMLButtonElement);
const countEl = requiredElement("#inbox-count", HTMLElement);
const statusEl = requiredElement("#status", HTMLElement);

function setStatus(text: string): void {
  statusEl.textContent = text;
}

async function refreshCount(): Promise<void> {
  const inbox = await getInbox();
  countEl.textContent =
    inbox.length === 1 ? "1 item in inbox" : `${inbox.length} items in inbox`;
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
    const markdown = await getMarkdown();
    const inbox = await getInbox();
    const merged = serializeMarkdown(
      mergeInbox(parseMarkdown(markdown), inbox),
    );
    const blob = new Blob([merged], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.md";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported bookmarks.md");
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

void refreshCount();
