"use client";

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

import { QUALITY } from "@/lib/world/constants";

/**
 * The image pipeline: ambient occlusion for contact shadows under eaves and between
 * trees, bloom that only the HDR sun disc crosses, a vignette to hold the frame, and
 * filmic tone mapping. AgX was tried and read washed-out next to it.
 */
export function PostEffects(): React.ReactElement | null {
  if (!QUALITY.postProcessing) return null;

  return (
    <EffectComposer multisampling={4}>
      {QUALITY.ambientOcclusion ? (
        <N8AO halfRes intensity={1.7} aoRadius={4} distanceFalloff={1.2} quality="medium" />
      ) : (
        <></>
      )}
      <Bloom luminanceThreshold={1.0} intensity={0.5} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
