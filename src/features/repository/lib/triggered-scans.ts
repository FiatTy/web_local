const STORAGE_KEY = '_my_scan_projects';

function readIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function markMyTriggeredScan(projectId: string): void {
  const ids = readIds();
  ids.add(projectId);
  writeIds(ids);
}

export function isMyTriggeredScan(projectId: string): boolean {
  return readIds().has(projectId);
}

export function clearMyTriggeredScan(projectId: string): void {
  const ids = readIds();
  ids.delete(projectId);
  writeIds(ids);
}
