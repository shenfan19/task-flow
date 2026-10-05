import { setIcon } from 'obsidian';

// The Tasks plugin's edit dialog puts its settings gear where the close
// button usually sits, and some themes hide the default close button, so the
// dialog can end up with no visible way to close it besides Esc. This watches
// for the dialog to open and adds an X at its top right, to the right of the
// gear, unless a visible close button is already there.
const WATCH_MS = 3000;

const hasVisibleCloseButton = (container) => {
  const button = container.querySelector('.modal-close-button:not(.modal-option-button):not(.ft-modal-close)');
  return !!button && button.getClientRects().length > 0;
};

// Closes the way a click outside the dialog does, so the focus goes back
// where it was. Sending Esc instead moved the focus to another pane.
const closeModal = (container) => {
  const native = container.querySelector('.modal-close-button:not(.modal-option-button):not(.ft-modal-close)');
  (native ?? container.querySelector('.modal-bg'))?.click();
};

const addCloseButton = (container) => {
  const gear = container.querySelector('.modal-option-button');
  const modal = container.querySelector('.modal');
  if (!gear || !modal || container.querySelector('.ft-modal-close')) return;
  if (hasVisibleCloseButton(container)) return;
  const button = modal.createEl('button', {
    cls: 'modal-close-button mod-raised clickable-icon ft-modal-close',
    attr: { 'aria-label': 'Close' }
  });
  setIcon(button, 'x');
  // Pressing the button must not take focus from the dialog's form first.
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', () => closeModal(container));
  placeBesideGear(button, gear);
};

// Both buttons are positioned absolutely, so the X takes the gear's top and
// size and goes to the right edge, and the gear moves left of it. Nothing is
// assumed about the theme's own sizes, they are read from the gear.
const EDGE_PX = 12;
const GAP_PX = 4;

const placeBesideGear = (button, gear) => {
  const style = activeWindow.getComputedStyle(gear);
  const width = gear.offsetWidth;
  const height = gear.offsetHeight;
  button.style.position = 'absolute';
  button.style.top = style.top;
  button.style.insetInlineStart = 'auto';
  button.style.insetInlineEnd = `${EDGE_PX}px`;
  if (width) button.style.width = `${width}px`;
  if (height) button.style.height = `${height}px`;
  button.style.margin = '0';
  gear.style.insetInlineEnd = `${EDGE_PX + (width || 28) + GAP_PX}px`;
};

// Call just before opening the Tasks edit dialog. Stops by itself once the
// dialog has been found or after a few seconds.
export const watchForTaskModal = () => {
  const body = activeDocument.body;
  const observer = new MutationObserver(() => {
    const container = body.querySelector('.modal-container:has(.modal-option-button)');
    if (!container) return;
    observer.disconnect();
    addCloseButton(container);
  });
  observer.observe(body, { childList: true, subtree: true });
  activeWindow.setTimeout(() => observer.disconnect(), WATCH_MS);
};
