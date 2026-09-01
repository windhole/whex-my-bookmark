export const UNSAVABLE_URL =
  /^(chrome|chrome-extension|edge|about|devtools|brave|moz-extension|safari-web-extension):/i;

export function canSaveUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.length > 0 && !UNSAVABLE_URL.test(url);
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
