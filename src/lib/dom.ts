export function requiredElement<T extends Element>(
  selector: string,
  ctor: new () => T,
): T {
  const el = document.querySelector(selector);
  if (!(el instanceof ctor)) {
    throw new Error(`missing ${selector}`);
  }
  return el;
}
