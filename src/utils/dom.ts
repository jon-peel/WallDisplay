export function getApp(): HTMLElement {
  return document.getElementById('app')!
}

export function clearApp(): void {
  getApp().innerHTML = ''
}

export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string>> = {},
  styles: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined) el.setAttribute(k, v)
  }
  Object.assign(el.style, styles)
  return el
}
