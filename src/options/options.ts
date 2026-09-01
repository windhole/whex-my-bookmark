import { contrastText, slotColor } from "../lib/areas";
import { requiredElement } from "../lib/dom";
import { parseMarkdown, saveSlots } from "../lib/markdown";
import { ensureInitialized, setMarkdown } from "../lib/storage";

const markdownEl = requiredElement("#markdown", HTMLTextAreaElement);
const legendEl = requiredElement("#slot-legend", HTMLOListElement);
const saveEl = requiredElement("#save", HTMLButtonElement);
const reloadEl = requiredElement("#reload", HTMLButtonElement);
const importEl = requiredElement("#import", HTMLInputElement);
const exportEl = requiredElement("#export", HTMLButtonElement);
const statusEl = requiredElement("#status", HTMLElement);

function renderLegend(markdown: string): void {
  const slots = saveSlots(parseMarkdown(markdown));
  legendEl.replaceChildren();
  slots.forEach((area, index) => {
    const li = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    const bg = slotColor(index);
    swatch.style.background = bg;
    swatch.style.outline = `1px solid ${contrastText(bg)}22`;
    const label = document.createElement("span");
    label.textContent = `${index + 1}. ${area.title}`;
    li.append(swatch, label);
    legendEl.append(li);
  });
}

async function loadEditor(): Promise<void> {
  const markdown = await ensureInitialized();
  markdownEl.value = markdown;
  renderLegend(markdown);
}

function setStatus(text: string): void {
  statusEl.textContent = text;
}

saveEl.addEventListener("click", () => {
  void (async () => {
    await setMarkdown(markdownEl.value);
    renderLegend(markdownEl.value);
    setStatus("Saved.");
  })();
});

reloadEl.addEventListener("click", () => {
  void loadEditor().then(() => setStatus("Reloaded."));
});

importEl.addEventListener("change", () => {
  const file = importEl.files?.[0];
  importEl.value = "";
  if (!file) return;
  void file.text().then(async (text) => {
    markdownEl.value = text;
    await setMarkdown(text);
    renderLegend(text);
    setStatus(`Imported ${file.name}`);
  });
});

exportEl.addEventListener("click", () => {
  const blob = new Blob([markdownEl.value], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookmarks.md";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Exported bookmarks.md");
});

void loadEditor();
