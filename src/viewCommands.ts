// Lets commands registered in main.ts reach the graph inside open views.
// Each mounted graph adds a handler for as long as it is on screen; a
// command runs in every one of them, which in practice is the one open view.
type ViewCommandHandler = (name: string) => void;
const handlers = new Set<ViewCommandHandler>();

// Returns the function that removes the handler again.
export function onViewCommand(handler: ViewCommandHandler): () => boolean {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function hasOpenGraph(): boolean {
  return handlers.size > 0;
}

export function runViewCommand(name: string): void {
  handlers.forEach((handler) => handler(name));
}

// Esc, caught by the view's key scope in main.ts. Obsidian answers an Esc that
// nothing consumed by switching to the previous tab, so the graph says
// whether it used the key: it does when it cleared a selection.
type EscapeHandler = () => boolean;
const escapeHandlers = new Set<EscapeHandler>();

export function onEscape(handler: EscapeHandler): () => boolean {
  escapeHandlers.add(handler);
  return () => escapeHandlers.delete(handler);
}

export function runEscape(): boolean {
  let used = false;
  escapeHandlers.forEach((handler) => { if (handler()) used = true; });
  return used;
}
