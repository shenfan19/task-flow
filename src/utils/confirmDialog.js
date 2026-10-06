import { Modal } from 'obsidian';

// Asks a yes/no question in an Obsidian dialog. Resolves to true only when
// the confirm button is pressed.
export function confirmDialog(app, { title, message, confirmText = 'Confirm' }) {
  return new Promise((resolve) => {
    let result = false;
    const modal = new Modal(app);
    modal.titleEl.setText(title);
    modal.contentEl.createEl('p', { text: message });
    const buttons = modal.contentEl.createDiv({ cls: 'modal-button-container' });
    buttons.createEl('button', { text: confirmText, cls: 'mod-warning' }).addEventListener('click', () => {
      result = true;
      modal.close();
    });
    buttons.createEl('button', { text: 'Cancel' }).addEventListener('click', () => modal.close());
    modal.onClose = () => resolve(result);
    modal.open();
  });
}
