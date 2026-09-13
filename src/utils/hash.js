// FNV-1a 32-bit hash, used to derive a node id that stays stable across
// re-parses of the task list as long as a task's file path and text don't change.
export function stableTaskId(path, description) {
  const input = `${path}::${description}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'task-' + (hash >>> 0).toString(36);
}
