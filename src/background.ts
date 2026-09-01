import { SAVE_SLOT_COUNT } from "./lib/areas";
import {
  areasToActionMenu,
  areasToPageMenu,
  type MenuNode,
} from "./lib/menu-tree";
import { parseMarkdown } from "./lib/markdown";
import { saveActiveTabToArea, type RuntimeMessage } from "./lib/save";
import { ensureInitialized } from "./lib/storage";

const PAGE_ROOT_ID = "whex-page-root";
const SESSION_TARGETS_KEY = "menuTargets";

chrome.runtime.onInstalled.addListener(() => {
  void bootstrap();
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrap();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.bookmarkMarkdown) {
    void queueMenuRebuild();
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  void openMenuTarget(String(info.menuItemId));
});

chrome.commands.onCommand.addListener((command) => {
  const match = /^save-area-([1-8])$/.exec(command);
  if (!match) return;
  const areaIndex = Number(match[1]) - 1;
  void saveActiveTabToArea(areaIndex, "");
});

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type !== "SAVE_TO_AREA") {
      return;
    }
    if (message.areaIndex < 0 || message.areaIndex >= SAVE_SLOT_COUNT) {
      sendResponse({ ok: false, reason: "unsavable" });
      return;
    }
    void saveActiveTabToArea(message.areaIndex, message.annotation ?? "").then(
      sendResponse,
    );
    return true;
  },
);

void bootstrap();

let menuBuild: Promise<void> = Promise.resolve();

async function bootstrap(): Promise<void> {
  await ensureInitialized();
  await queueMenuRebuild();
}

function queueMenuRebuild(): Promise<void> {
  menuBuild = menuBuild.then(rebuildMenus, rebuildMenus);
  return menuBuild;
}

async function rebuildMenus(): Promise<void> {
  const markdown = await ensureInitialized();
  const { areas } = parseMarkdown(markdown);
  await chrome.contextMenus.removeAll();

  const targets: Record<string, string> = {};
  let seq = 0;
  const nextId = () => `m${++seq}`;

  const pageRoot = areasToPageMenu(areas);
  chrome.contextMenus.create({
    id: PAGE_ROOT_ID,
    title: pageRoot.title,
    contexts: ["page"],
  });
  createItems(pageRoot.children, PAGE_ROOT_ID, ["page"], nextId, targets);

  const actionItems = areasToActionMenu(areas);
  createItems(actionItems, undefined, ["action"], nextId, targets);

  await chrome.storage.session.set({ [SESSION_TARGETS_KEY]: targets });
}

type MenuContexts = NonNullable<chrome.contextMenus.CreateProperties["contexts"]>;

function createItems(
  nodes: MenuNode[],
  parentId: string | undefined,
  contexts: MenuContexts,
  nextId: () => string,
  targets: Record<string, string>,
): void {
  for (const node of nodes) {
    const id = nextId();
    chrome.contextMenus.create({
      id,
      parentId,
      title: node.title,
      contexts,
    });
    if (node.kind === "link") {
      targets[id] = node.url;
    } else {
      createItems(node.children, id, contexts, nextId, targets);
    }
  }
}

async function openMenuTarget(menuItemId: string): Promise<void> {
  const stored = await chrome.storage.session.get(SESSION_TARGETS_KEY);
  let targets = stored[SESSION_TARGETS_KEY] as Record<string, string> | undefined;
  if (!targets || !targets[menuItemId]) {
    await queueMenuRebuild();
    const retry = await chrome.storage.session.get(SESSION_TARGETS_KEY);
    targets = retry[SESSION_TARGETS_KEY] as Record<string, string> | undefined;
  }
  const url = targets?.[menuItemId];
  if (!url) return;
  await chrome.tabs.create({ url });
}
