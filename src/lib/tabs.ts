export const UNSAVABLE_URL =
  /^(chrome|chrome-extension|edge|about|devtools|brave|moz-extension|safari-web-extension):/i;

export type PageToSave = {
  url: string;
  title: string;
};

export function canSaveUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.length > 0 && !UNSAVABLE_URL.test(url);
}

export function pageFromTab(
  tab: chrome.tabs.Tab | undefined,
): PageToSave | undefined {
  if (!tab) return undefined;
  const url = tab.url || tab.pendingUrl;
  if (!canSaveUrl(url)) return undefined;
  return { url, title: tab.title?.trim() || url };
}

export async function getActiveTabRaw(): Promise<chrome.tabs.Tab | undefined> {
  const lastNormal = await chrome.windows
    .getLastFocused({ populate: true, windowTypes: ["normal"] })
    .catch(() => undefined);
  const fromNormal = lastNormal?.tabs?.find((tab) => tab.active);
  if (fromNormal) return fromNormal;

  const [focused] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (focused) return focused;

  const [current] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (current) return current;

  const activeTabs = await chrome.tabs.query({ active: true });
  return activeTabs[0];
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tab = await getActiveTabRaw();
  return pageFromTab(tab) ? tab : undefined;
}

export async function getPageToSave(): Promise<PageToSave | undefined> {
  return pageFromTab(await getActiveTabRaw());
}
