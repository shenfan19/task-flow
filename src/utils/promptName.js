import { Modal } from 'obsidian';

// Asks for a name in an Obsidian dialog. Resolves to the trimmed name, or
// null when the dialog is closed without one. `validate(name)` returns an
// error message to show, or null when the name is fine. `value` fills the
// box to start with, `submitText` labels the button and `emptyText` is
// shown when the box is left empty.
export function promptName(app, {
  title,
  placeholder = '',
  value = '',
  submitText = 'Create',
  emptyText = 'Enter a name.',
  validate = () => null
}) {
  return new Promise((resolve) => {
    let result = null;
    const modal = new Modal(app);
    modal.titleEl.setText(title);
    const input = modal.contentEl.createEl('input', { type: 'text', placeholder, value, cls: 'ft-prompt-input' });
    const error = modal.contentEl.createDiv({ cls: 'ft-prompt-error' });
    const buttons = modal.contentEl.createDiv({ cls: 'modal-button-container' });

    const submit = () => {
      const name = input.value.trim();
      const problem = name ? validate(name) : emptyText;
      if (problem) {
        error.setText(problem);
        return;
      }
      result = name;
      modal.close();
    };

    buttons.createEl('button', { text: submitText, cls: 'mod-cta' }).addEventListener('click', submit);
    buttons.createEl('button', { text: 'Cancel' }).addEventListener('click', () => modal.close());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        submit();
      }
    });
    modal.onClose = () => resolve(result);
    modal.open();
    input.focus();
    input.select();
  });
}
