import { toPng } from 'html-to-image';

/**
 * Captures a DOM node and downloads it as a high-res PNG
 * @param {HTMLElement} node - Target DOM node to capture
 * @param {string} fileName - File name for the download
 */
export async function downloadCardImage(node, fileName = 'tathya-quote.png') {
    if (!node) return null;

    try {
        const dataUrl = await toPng(node, {
            quality: 0.95,
            pixelRatio: 2, // Ensures high DPI crispness on mobile/desktop displays
            cacheBust: true,
            filter: (domNode) => !domNode.classList?.contains('no-export'), // Exclude action buttons
        });

        // Trigger download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();

        return dataUrl;
    } catch (err) {
        console.error('Failed to export card image:', err);
        throw err;
    }
}

/**
 * Generates a File object from the card node for Web Share API
 */
export async function getCardFile(node, fileName = 'tathya-quote.png') {
    if (!node) return null;

    const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 2 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    return new File([blob], fileName, { type: 'image/png' });
}