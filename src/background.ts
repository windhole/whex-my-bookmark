import { refreshInboxBadge } from "./lib/badge";
import {
  areasToActionMenu,
  areasToPageMenu,
  type MenuNode,
} from "./lib/menu-tree";
import { mergeInbox, parseMarkdown } from "./lib/markdown";
import { notifySaveError } from "./lib/save-feedback";
import { saveCurrentPageToInbox } from "./lib/save";
import { ensureLibrary, getInbox } from "./lib/storage";

const PAGE_ROOT_ID = "whex-page-root";
const SESSION_TARGETS_KEY = "menuTargets";
const SESSION_MENU_IDS_KEY = "menuItemIds";

let work: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  work = work.then(task, task);
  return work;
}

function queueBootstrap(): Promise<void> {
  return enqueue(bootstrap);
}

function queueMenuRebuild(): Promise<void> {
  return enqueue(rebuildMenus);
}

chrome.runtime.onInstalled.addListener(() => {
  void queueBootstrap();
});

chrome.runtime.onStartup.addListener(() => {
  void queueBootstrap();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.bookmarkMarkdown || changes.inboxEntries) {
    void queueMenuRebuild();
  }
  if (changes.inboxEntries || changes.bookmarkMarkdown) {
    void refreshInboxBadge();
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  void openMenuTarget(String(info.menuItemId));
});

chrome.action.onClicked.addListener(() => {
  void enqueue(saveFromToolbar);
});

void refreshInboxBadge();
void queueBootstrap();

async function bootstrap(): Promise<void> {
  await refreshInboxBadge();
  await ensureLibrary();
  await rebuildMenus();
}

async function saveFromToolbar(): Promise<void> {
  const result = await saveCurrentPageToInbox();
  if (!result.ok) {
    await notifySaveError(result.reason);
    return;
  }
  await refreshInboxBadge("ok");
}

async function rebuildMenus(): Promise<void> {
  const markdown = await ensureLibrary();
  const inbox = await getInbox();
  const { areas } = mergeInbox(parseMarkdown(markdown), inbox);

  await clearMenus();

  const targets: Record<string, string> = {};
  const createdIds: string[] = [];
  let seq = 0;
  const nextId = () => `m${++seq}`;

  const pageRoot = areasToPageMenu(areas);
  await createMenuItem({
    id: PAGE_ROOT_ID,
    title: pageRoot.title,
    contexts: ["page"],
  });
  createdIds.push(PAGE_ROOT_ID);
  await createItems(
    pageRoot.children,
    PAGE_ROOT_ID,
    ["page"],
    nextId,
    targets,
    createdIds,
  );

  const actionItems = areasToActionMenu(areas);
  await createItems(
    actionItems,
    undefined,
    ["action"],
    nextId,
    targets,
    createdIds,
  );

  await chrome.storage.session.set({
    [SESSION_TARGETS_KEY]: targets,
    [SESSION_MENU_IDS_KEY]: createdIds,
  });
}

type MenuContexts = NonNullable<chrome.contextMenus.CreateProperties["contexts"]>;

async function createItems(
  nodes: MenuNode[],
  parentId: string | undefined,
  contexts: MenuContexts,
  nextId: () => string,
  targets: Record<string, string>,
  createdIds: string[],
): Promise<void> {
  for (const node of nodes) {
    const id = nextId();
    const properties: chrome.contextMenus.CreateProperties = {
      id,
      title: node.title,
      contexts,
    };
    if (parentId !== undefined) {
      properties.parentId = parentId;
    }
    await createMenuItem(properties);
    createdIds.push(id);
    if (node.kind === "link") {
      targets[id] = node.url;
    } else {
      await createItems(
        node.children,
        id,
        contexts,
        nextId,
        targets,
        createdIds,
      );
    }
  }
}

async function clearMenus(): Promise<void> {
  const stored = await chrome.storage.session.get(SESSION_MENU_IDS_KEY);
  const ids = stored[SESSION_MENU_IDS_KEY];
  if (Array.isArray(ids)) {
    for (const id of ids) {
      if (typeof id === "string") {
        await removeMenuItem(id);
      }
    }
  }
  await removeAllMenuItems();
}

function createMenuItem(
  properties: chrome.contextMenus.CreateProperties,
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(properties, () => {
      const message = chrome.runtime.lastError?.message;
      if (message) {
        reject(new Error(message));
        return;
      }
      resolve();
    });
  });
}

function removeMenuItem(id: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.contextMenus.remove(id, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

function removeAllMenuItems(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      const message = chrome.runtime.lastError?.message;
      if (message) {
        reject(new Error(message));
        return;
      }
      resolve();
    });
  });
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
