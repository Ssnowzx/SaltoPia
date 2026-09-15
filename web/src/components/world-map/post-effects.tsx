"use client";

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

import { QUALITY } from "@/lib/world/constants";

/**
 * The image pipeline: ambient occlusion for contact shadows under eaves and between
 * trees, a whisper of bloom on the sun and lanterns, a vignette to hold the frame, and
 * filmic tone mapping so the sunset does not clip to flat orange.
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
      <Bloom luminanceThreshold={0.92} intensity={0.22} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
