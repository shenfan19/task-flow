// Lets commands registered in main.ts reach the graph inside open views.
// Each mounted graph adds a handler for as long as it is on screen; a
// command runs in every one of them, which in practice is the one open view.
const handlers = new Set();

// Returns the function that removes the handler again.
export function onViewCommand(handler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function hasOpenGraph() {
  return handlers.size > 0;
}

export function runViewCommand(name) {
  handlers.forEach((handler) => handler(name));
}
