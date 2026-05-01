type DbgWindow = Window & { dbgAppend?: (s: string) => void }

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function timestamp(): string {
  const d = new Date()
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function stringifyDetail(detail: unknown): string {
  if (detail === undefined) return ''
  if (detail instanceof Error) {
    const name = detail.name || 'Error'
    return ': ' + name + ': ' + (detail.message || String(detail))
  }
  if (typeof detail === 'string') return ': ' + detail
  try {
    return ': ' + String(detail)
  } catch {
    return ': [unprintable]'
  }
}

export function dbg(label: string, detail?: unknown): void {
  const append = (window as DbgWindow).dbgAppend
  if (!append) return
  append('\n' + timestamp() + ' ' + label + stringifyDetail(detail))
}
