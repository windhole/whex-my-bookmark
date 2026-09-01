import {
  areasToActionMenu,
  areasToPageMenu,
  type MenuNode,
} from "./lib/menu-tree";
import { mergeInbox, parseMarkdown } from "./lib/markdown";
import { saveCurrentPageToInbox } from "./lib/save";
import { getInbox, getMarkdown } from "./lib/storage";

const PAGE_ROOT_ID = "whex-page-root";
const SESSION_TARGETS_KEY = "menuTargets";

chrome.runtime.onInstalled.addListener(() => {
  void bootstrap();
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrap();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.bookmarkMarkdown || changes.inboxEntries) {
    void queueMenuRebuild();
  }
  if (changes.inboxEntries) {
    void refreshBadge();
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  void openMenuTarget(String(info.menuItemId));
});

chrome.action.onClicked.addListener(() => {
  void saveFromToolbar();
});

void bootstrap();

let menuBuild: Promise<void> = Promise.resolve();

async function bootstrap(): Promise<void> {
  await refreshBadge();
  await queueMenuRebuild();
}

async function refreshBadge(): Promise<void> {
  const inbox = await getInbox();
  await chrome.action.setBadgeBackgroundColor({ color: "#009E73" });
  await chrome.action.setBadgeText({
    text: inbox.length > 0 ? String(inbox.length) : "",
  });
}

function queueMenuRebuild(): Promise<void> {
  menuBuild = menuBuild.then(rebuildMenus, rebuildMenus);
  return menuBuild;
}

async function saveFromToolbar(): Promise<void> {
  const result = await saveCurrentPageToInbox();
  if (!result.ok) {
    await chrome.action.setBadgeBackgroundColor({ color: "#D55E00" });
    await chrome.action.setBadgeText({ text: "!" });
    return;
  }
  await chrome.action.setBadgeBackgroundColor({ color: "#009E73" });
  await chrome.action.setBadgeText({ text: String(result.inboxCount) });
}

async function rebuildMenus(): Promise<void> {
  const markdown = await getMarkdown();
  const inbox = await getInbox();
  const { areas } = mergeInbox(parseMarkdown(markdown), inbox);
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
