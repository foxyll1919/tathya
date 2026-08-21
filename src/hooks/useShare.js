import { useState, useCallback } from 'react';

export function useShare() {
    const [copied, setCopied] = useState(false);

    const shareQuote = useCallback(async ({ title, text, url, file }) => {
        // 1. Try Native Web Share API (with file support if provided)
        if (navigator.share) {
            try {
                const shareData = { title: title || 'Tathya Wisdom', text, url };

                if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }

                await navigator.share(shareData);
                return { status: 'shared' };
            } catch (err) {
                if (err.name === 'AbortError') return { status: 'cancelled' };
                console.warn('Native share failed, falling back to clipboard:', err);
            }
        }

        // 2. Fallback to Direct Clipboard Copy
        try {
            const copyText = text + (url ? `\n\nRead more at: ${url}` : '');
            await navigator.clipboard.writeText(copyText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
            return { status: 'copied' };
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            return { status: 'failed', error: err };
        }
    }, []);

    return { shareQuote, copied };
}