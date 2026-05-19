export function perfNow() {
  return Date.now();
}

export function perfLog(label: string, startAt: number, extras?: Record<string, string | number | boolean>) {
  if (!__DEV__) return;
  const elapsed = Date.now() - startAt;
  const meta = extras ? ` ${JSON.stringify(extras)}` : "";
  // eslint-disable-next-line no-console
  console.log(`[perf] ${label} ${elapsed}ms${meta}`);
}
