/// <reference lib="dom.iterable" />
import { useEffect, useState } from 'react';

let fontPromise: Promise<void> | undefined;

export function useAppFonts(): [boolean, Error | null] {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    // Declare the full range so the browser uses the variable weight axis.
    fontPromise ??= (async () => {
      const asset = require('@/assets/fonts/PretendardVariable.ttf');
      const uri = typeof asset === 'string' ? asset : asset.default;
      const face = new FontFace('PretendardVariable', `url("${uri}")`, {
        weight: '100 900',
        style: 'normal',
        display: 'swap',
      });
      await face.load();
      document.fonts.add(face);
    })().catch((cause) => {
      fontPromise = undefined;
      throw cause;
    });
    fontPromise.then(
      () => { if (active) setLoaded(true); },
      (cause) => { if (active) setError(cause instanceof Error ? cause : new Error(String(cause))); },
    );
    return () => { active = false; };
  }, []);

  return [loaded, error];
}
