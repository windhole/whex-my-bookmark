import { contrastText, slotColor } from "../lib/areas";
import { requiredElement } from "../lib/dom";
import { parseMarkdown, saveSlots } from "../lib/markdown";
import type { SaveToAreaResponse } from "../lib/save";
import { ensureInitialized } from "../lib/storage";

const slotsEl = requiredElement("#slots", HTMLElement);
const annotationEl = requiredElement("#annotation", HTMLTextAreaElement);
const statusEl = requiredElement("#status", HTMLElement);
const optionsEl = requiredElement("#open-options", HTMLAnchorElement);

let saving = false;

async function render(): Promise<void> {
  const markdown = await ensureInitialized();
  const slots = saveSlots(parseMarkdown(markdown));
  slotsEl.replaceChildren();
  slots.forEach((area, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.dataset.index = String(index);
    const bg = slotColor(index);
    button.style.background = bg;
    button.style.color = contrastText(bg);
    button.setAttribute(
      "aria-label",
      `Save to ${area.title} (${index + 1})`,
    );

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = String(index + 1);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = area.title;

    button.append(num, name);
    button.addEventListener("click", () => {
      void saveTo(index, button);
    });
    slotsEl.append(button);
  });
}

async function saveTo(index: number, button: HTMLButtonElement): Promise<void> {
  if (saving) return;
  saving = true;
  statusEl.textContent = "Saving…";
  const annotation = annotationEl.value;
  const response = (await chrome.runtime.sendMessage({
    type: "SAVE_TO_AREA",
    areaIndex: index,
    annotation,
  })) as SaveToAreaResponse;

  if (!response?.ok) {
    statusEl.textContent =
      response?.reason === "unsavable"
        ? "This page cannot be saved."
        : "No active tab to save.";
    saving = false;
    return;
  }

  const nameEl = button.querySelector(".name");
  if (nameEl) {
    nameEl.textContent = "Saved";
  }
  button.classList.add("saved");
  statusEl.textContent = `Saved to ${response.areaTitle}`;
  window.setTimeout(() => window.close(), 450);
}

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLTextAreaElement) {
    if (event.key !== "Escape") return;
  }
  const match = /^[1-8]$/.exec(event.key);
  if (!match) return;
  event.preventDefault();
  const index = Number(match[0]) - 1;
  const button = slotsEl.querySelectorAll("button")[index];
  if (button instanceof HTMLButtonElement) {
    void saveTo(index, button);
  }
});

optionsEl.addEventListener("click", (event) => {
  event.preventDefault();
  void chrome.runtime.openOptionsPage();
});

void render();
