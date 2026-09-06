import { APP_VERSION_NAME } from "virtual:app-version";
import { refreshInboxBadge } from "./lib/badge";
import {
  areasToActionMenu,
  areasToPageMenu,
  type MenuNode,
} from "./lib/menu-tree";
import { getMergedDocument } from "./lib/merged-document";
import { notifyDuplicateInbox, notifySaveError } from "./lib/save-feedback";
import { saveCurrentPageToInbox } from "./lib/save";
import { ensureLibrary } from "./lib/storage";

const PAGE_ROOT_ID = "whex-page-root";
const OPEN_LIST_ACTION_ID = "whex-open-list-action";
const OPEN_LIST_PAGE_ID = "whex-open-list-page";
const BROWSE_PAGE_PATH = "src/browse/index.html";
const SESSION_TARGETS_KEY = "menuTargets";
const SESSION_MENU_IDS_KEY = "menuItemIds";

const ACTION_TITLE = `Save current page to inbox · v${APP_VERSION_NAME}`;

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
  const id = String(info.menuItemId);
  if (id === OPEN_LIST_ACTION_ID || id === OPEN_LIST_PAGE_ID) {
    void openBrowsePage();
    return;
  }
  void openMenuTarget(id);
});

chrome.action.onClicked.addListener(() => {
  void enqueue(saveFromToolbar);
});

void refreshInboxBadge();
void queueBootstrap();

async function bootstrap(): Promise<void> {
  await chrome.action.setTitle({ title: ACTION_TITLE });
  await refreshInboxBadge();
  await ensureLibrary();
  await rebuildMenus();
}

async function saveFromToolbar(): Promise<void> {
  const result = await saveCurrentPageToInbox();
  if (!result.ok) {
    if (result.reason === "duplicate") {
      await notifyDuplicateInbox();
    } else {
      await notifySaveError(result.reason);
    }
    return;
  }
  await refreshInboxBadge("ok");
}

async function rebuildMenus(): Promise<void> {
  const { areas } = await getMergedDocument(true);

  await clearMenus();

  const targets: Record<string, string> = {};
  const createdIds: string[] = [];
  const usedIds = new Set<string>();
  const nextFolderId = (() => {
    let seq = 0;
    return (label: string) => {
      let id = `f-${stableKey(label)}`;
      while (usedIds.has(id)) {
        id = `f-${stableKey(label)}-${++seq}`;
      }
      usedIds.add(id);
      return id;
    };
  })();

  const pageRoot = areasToPageMenu(areas);
  await createMenuItem({
    id: PAGE_ROOT_ID,
    title: pageRoot.title,
    contexts: ["page"],
  });
  createdIds.push(PAGE_ROOT_ID);
  await createMenuItem({
    id: OPEN_LIST_PAGE_ID,
    parentId: PAGE_ROOT_ID,
    title: "Open bookmark list",
    contexts: ["page"],
  });
  createdIds.push(OPEN_LIST_PAGE_ID);
  await createItems(
    pageRoot.children,
    PAGE_ROOT_ID,
    ["page"],
    nextFolderId,
    targets,
    createdIds,
    usedIds,
  );

  await createMenuItem({
    id: OPEN_LIST_ACTION_ID,
    title: "Open bookmark list",
    contexts: ["action"],
  });
  createdIds.push(OPEN_LIST_ACTION_ID);

  const actionItems = areasToActionMenu(areas);
  await createItems(
    actionItems,
    undefined,
    ["action"],
    nextFolderId,
    targets,
    createdIds,
    usedIds,
  );

  await chrome.storage.session.set({
    [SESSION_TARGETS_KEY]: targets,
    [SESSION_MENU_IDS_KEY]: createdIds,
  });
}

async function openBrowsePage(): Promise<void> {
  await chrome.tabs.create({ url: chrome.runtime.getURL(BROWSE_PAGE_PATH) });
}

type MenuContexts = NonNullable<chrome.contextMenus.CreateProperties["contexts"]>;

async function createItems(
  nodes: MenuNode[],
  parentId: string | undefined,
  contexts: MenuContexts,
  nextFolderId: (label: string) => string,
  targets: Record<string, string>,
  createdIds: string[],
  usedIds: Set<string>,
): Promise<void> {
  for (const node of nodes) {
    if (node.kind === "link") {
      const id = uniqueLinkId(node.url, usedIds);
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
      targets[id] = node.url;
      continue;
    }

    const id = nextFolderId(
      parentId ? `${parentId}/${node.title}` : node.title,
    );
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
    await createItems(
      node.children,
      id,
      contexts,
      nextFolderId,
      targets,
      createdIds,
      usedIds,
    );
  }
}

function uniqueLinkId(url: string, usedIds: Set<string>): string {
  let id = `u-${stableKey(url)}`;
  let n = 0;
  while (usedIds.has(id)) {
    id = `u-${stableKey(url)}-${++n}`;
  }
  usedIds.add(id);
  return id;
}

function stableKey(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
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
  const targets = stored[SESSION_TARGETS_KEY] as
    | Record<string, string>
    | undefined;
  const url = targets?.[menuItemId];
  if (!url) {
    // Folder / unknown item: refresh menus if session was lost, but never open
    // a remapped id (sequential ids used to point at the wrong bookmark).
    if (!targets) {
      await queueMenuRebuild();
    }
    return;
  }
  await chrome.tabs.create({ url });
}
