"use client";

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

import { BLOOM, QUALITY } from "@/lib/world/constants";

/**
 * The image pipeline: ambient occlusion for contact shadows under eaves and between
 * trees, bloom that only the HDR sun disc and the glitter on the water cross, a vignette to
 * hold the frame, and filmic tone mapping - AgX was tried and read washed-out next to it.
 * A contrast grade after it was tried too: it works on linear values here and crushed the
 * midtones, so the whole world went a stop darker.
 */
interface PostEffectsProps {
  /** Ambient occlusion is the costliest pass; the lower quality tiers go without it. */
  readonly ambientOcclusion: boolean;
}

export function PostEffects({ ambientOcclusion }: PostEffectsProps): React.ReactElement | null {
  if (!QUALITY.postProcessing) return null;

  return (
    <EffectComposer multisampling={4}>
      {ambientOcclusion ? (
        <N8AO halfRes intensity={1.7} aoRadius={4} distanceFalloff={1.2} quality="medium" />
      ) : (
        <></>
      )}
      <Bloom luminanceThreshold={BLOOM.threshold} luminanceSmoothing={BLOOM.smoothing} intensity={BLOOM.intensity} radius={BLOOM.radius} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
