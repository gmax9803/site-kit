// Behavior for <CopyButton>. One delegated click listener handles every
// `[data-sk-copy]` button on the page, including ones added after load.
//
// The text to copy comes from, in order:
//   1. `data-copy` (a literal value; page scripts may set it at runtime)
//   2. `data-copy-target` (a selector; its `value` or text content is copied)
//
// Pages that need to trigger a copy themselves (for example a Share button
// that falls back to copying) can import `copyFromButton`.

const RESET_MS = 2000;

/** Write text to the clipboard. Resolves true on success, false otherwise. */
export const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fall through to the legacy path (some embedded browsers deny the API).
    }
  }

  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();

  try {
    return document.execCommand('copy');
  } catch (_) {
    return false;
  } finally {
    field.remove();
  }
};

const copyValueFor = (button) => {
  if (button.dataset.copy) return button.dataset.copy;
  if (!button.dataset.copyTarget) return '';

  try {
    const target = document.querySelector(button.dataset.copyTarget);
    if (!target) return '';
    if ('value' in target) return String(target.value).trim();
    return target.textContent?.trim() || '';
  } catch (_) {
    return '';
  }
};

const setState = (button, state) => {
  const status = button.querySelector('[data-sk-copy-status]');
  const texts = {
    idle: button.dataset.idleText ?? '',
    copied: button.dataset.copiedText ?? '',
    failed: button.dataset.failedText ?? '',
  };

  window.clearTimeout(Number(button.dataset.copyTimer));
  if (state === 'idle') delete button.dataset.copyState;
  else button.dataset.copyState = state;

  // Visible-text buttons always show a label; icon-only buttons keep their
  // status region empty at rest so screen readers only hear the change.
  if (status) status.textContent = state === 'idle' && !button.dataset.hasText ? '' : texts[state];

  if (state !== 'idle') {
    const resetMs = Number(button.dataset.resetMs) || RESET_MS;
    button.dataset.copyTimer = String(window.setTimeout(() => setState(button, 'idle'), resetMs));
  }
};

/** Copy the button's value and show the copied or failed state. */
export const copyFromButton = async (button) => {
  const text = copyValueFor(button);
  if (!text || button.dataset.copyBusy) return false;

  button.dataset.copyBusy = 'true';
  const copied = await copyText(text);
  delete button.dataset.copyBusy;

  // Last resort: let the visitor copy it by hand.
  if (!copied && button.dataset.copyPrompt) {
    window.prompt(button.dataset.copyPrompt, text);
    return false;
  }

  setState(button, copied ? 'copied' : 'failed');
  return copied;
};

if (!window.__skCopyBound) {
  window.__skCopyBound = true;
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('[data-sk-copy]');
    if (!button || button.disabled) return;
    copyFromButton(button);
  });
}
