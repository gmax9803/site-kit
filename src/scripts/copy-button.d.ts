/** Write text to the clipboard. Resolves true on success, false otherwise. */
export function copyText(text: string): Promise<boolean>;

/** Copy the button's value and show the copied or failed state. */
export function copyFromButton(button: HTMLButtonElement): Promise<boolean>;
