export const copyToClipboard = async (
  title: string,
  link: string
): Promise<void> => {
  const text = `📍 ${title || "Maksi"}\n${link}`;

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err);
    throw err;
  }
};