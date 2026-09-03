import {
  filterFlatBookmarks,
  flattenBookmarks,
  groupByArea,
  type FlatBookmark,
} from "../lib/browse-model";
import { requiredElement } from "../lib/dom";
import { getMergedDocument } from "../lib/merged-document";

const searchEl = requiredElement("#search", HTMLInputElement);
const resultsEl = requiredElement("#results", HTMLElement);
const summaryEl = requiredElement("#summary", HTMLElement);
const emptyEl = requiredElement("#empty", HTMLElement);

let allItems: FlatBookmark[] = [];
let query = "";

async function reload(): Promise<void> {
  const doc = await getMergedDocument(true);
  allItems = flattenBookmarks(doc.areas);
  render();
}

function render(): void {
  const filtered = filterFlatBookmarks(allItems, query);
  const groups = groupByArea(filtered);
  resultsEl.replaceChildren();

  summaryEl.textContent =
    query.trim() === ""
      ? `${allItems.length} bookmarks`
      : `${filtered.length} of ${allItems.length} bookmarks`;

  emptyEl.hidden = filtered.length > 0;

  for (const [area, items] of groups) {
    const section = document.createElement("section");
    section.className = "area";

    const heading = document.createElement("h2");
    heading.className = "area-heading";
    const title = document.createElement("span");
    title.textContent = area;
    const count = document.createElement("span");
    count.className = "area-count";
    count.textContent = String(items.length);
    heading.append(title, count);

    const cards = document.createElement("div");
    cards.className = "cards";
    for (const item of items) {
      cards.append(renderCard(item));
    }

    section.append(heading, cards);
    resultsEl.append(section);
  }
}

function renderCard(item: FlatBookmark): HTMLAnchorElement {
  const card = document.createElement("a");
  card.className = "card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title;

  const url = document.createElement("div");
  url.className = "card-url";
  url.textContent = item.url;

  card.append(title, url);

  if (item.path.length > 0) {
    const path = document.createElement("div");
    path.className = "card-path";
    path.textContent = item.path.join(" / ");
    card.append(path);
  }

  if (item.annotation.trim() !== "") {
    const note = document.createElement("p");
    note.className = "card-note";
    note.textContent = item.annotation;
    card.append(note);
  }

  return card;
}

searchEl.addEventListener("input", () => {
  query = searchEl.value;
  render();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.bookmarkMarkdown || changes.inboxEntries) {
    void reload();
  }
});

void reload().then(() => {
  searchEl.focus();
});
