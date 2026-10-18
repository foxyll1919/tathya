import React, { useEffect, useState } from 'react';

/**
 * Full-bleed photo backdrop for the story card.
 *
 * Layer order (bottom to top):
 *   dominant-colour base -> <img> -> palette tint -> scrim -> grain
 *
 * The scrim is not decoration: it is what holds the quote text above 4.5:1
 * over an arbitrary photograph. The tint is what stops the photo fighting
 * the palette. Together they mean any image can obey any preset.
 *
 * The whole thing is best-effort. If the image fails to load, or the
 * device is offline, the base colour and the app's own gradient
 * background remain — the layer simply fades out.
 */
export default function PhotoBackdrop({ photo, tint, visible = true }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset the load flags whenever the source changes, otherwise the
  // previous image's "loaded" state leaks into the new one.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [photo?.url]);

  // Warm the connection for the next backdrop without blocking paint.
  useEffect(() => {
    if (!photo?.url || typeof fetch === 'undefined') return undefined;
    const controller = new AbortController();
    fetch(photo.url, { signal: controller.signal, cache: 'force-cache' }).catch(() => {});
    return () => controller.abort();
  }, [photo?.url]);

  if (!photo?.url || !tint || !visible || failed) return null;

  return (
    <>
      <div className="photo-layer" aria-hidden="true">
        <div
          className="photo-layer__base"
          style={{ '--photo-placeholder': photo.dominant || tint.tint }}
        />
        <img
          className="photo-layer__img"
          src={photo.url}
          alt=""
          decoding="async"
          fetchPriority="low"
          loading="lazy"
          data-loaded={loaded ? 'true' : 'false'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
        <div className="photo-layer__tint" />
        <div className="photo-layer__scrim" />
        <div className="photo-layer__grain" />
      </div>

      {/*
        Unsplash requires visible photographer attribution whenever their
        images are shown. It sits above the backdrop but below the sheets,
        and only becomes interactive on keyboard focus so it never
        intercepts taps meant for the card.
      */}
      <p className="photo-credit">
        {photo.credit ? (
          <>
            {'Photo by '}
            <a href={photo.credit.profileUrl} target="_blank" rel="noreferrer noopener">
              {photo.credit.name}
            </a>
            {' on '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer noopener">
              Unsplash
            </a>
          </>
        ) : (
          <>
            {'Photo via '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer noopener">
              Unsplash
            </a>
          </>
        )}
      </p>
    </>
  );
}