"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface SceneReadyProps {
  /** Called once, on the frame after the world has actually been drawn. */
  readonly onReady: () => void;
}

/**
 * Reports the first frame the world is drawn on.
 *
 * Building the scene - the texture atlas, the terrain mesh, every merged model - takes
 * a moment, and until it finishes the canvas is empty. The title state used to be
 * rendered immediately over that emptiness, so opening the site could show a bare cream
 * page with a wordmark floating on it. It waits for this instead.
 *
 * Two frames, not one: the first is when this component's `useFrame` first runs, which
 * can precede the draw that actually puts the world on screen.
 */
export function SceneReady({ onReady }: SceneReadyProps): null {
  const frames = useRef(0);
  const done = useRef(false);

  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current < 2) return;
    done.current = true;
    onReady();
  });

  return null;
}
