import html2canvas from 'html2canvas';

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err);
    throw err;
  }
};

export const copyRichBillSummaryToClipboard = async (
  billId: string,
  restaurantName: string,
  summaryElement: HTMLElement
): Promise<void> => {
  try {
    // Capture the summary element as an image
    const canvas = await html2canvas(summaryElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    
    const imageDataUrl = canvas.toDataURL('image/png');
    const shareUrl = `${window.location.origin}/bill/${billId}`;
    
    // Create rich HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #0d9488; margin-bottom: 16px;">📍 ${restaurantName || 'Bill Summary'}</h2>
        <img src="${imageDataUrl}" alt="Bill Summary" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px;" />
        <p style="margin: 8px 0;">
          <a href="${shareUrl}" style="color: #0d9488; text-decoration: none;">${shareUrl}</a>
        </p>
      </div>
    `;
    
    // Try to write rich content to clipboard
    if (navigator.clipboard && navigator.clipboard.write) {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([shareUrl], { type: 'text/plain' }),
      });
      
      await navigator.clipboard.write([clipboardItem]);
    } else {
      // Fallback to plain text
      await copyToClipboard(shareUrl);
    }
  } catch (err) {
    console.error('Failed to copy rich content to clipboard:', err);
    // Fallback to plain text
    const shareUrl = `${window.location.origin}/bill/${billId}`;
    await copyToClipboard(shareUrl);
  }
};