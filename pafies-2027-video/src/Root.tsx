import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { DURACAO_FRAMES, FPS, hojeEmBrasilia, PropsVideo } from "./config";
import { Pafies } from "./Pafies";

// Sem data informada, a contagem usa o dia em que o vídeo é renderizado.
const fixarData: CalculateMetadataFunction<PropsVideo> = ({ props }) => ({
  props: { ...props, dataReferencia: props.dataReferencia || hojeEmBrasilia() },
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PafiesVertical"
      component={Pafies}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={DURACAO_FRAMES}
      defaultProps={{ dataReferencia: "" }}
      calculateMetadata={fixarData}
    />
    <Composition
      id="PafiesHorizontal"
      component={Pafies}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={DURACAO_FRAMES}
      defaultProps={{ dataReferencia: "" }}
      calculateMetadata={fixarData}
    />
  </>
);
