import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { DATA_REFERENCIA_PADRAO, DURACAO_FRAMES, FPS, hojeEmBrasilia, PropsVideo } from "./config";
import { Pafies } from "./Pafies";

// Data de referência do roteiro: 28/10/2026 → faltam 86 dias.
// Com dataReferencia vazia (--props='{"dataReferencia":""}'), a contagem usa o dia do render.
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
      defaultProps={{ dataReferencia: DATA_REFERENCIA_PADRAO }}
      calculateMetadata={fixarData}
    />
    <Composition
      id="PafiesHorizontal"
      component={Pafies}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={DURACAO_FRAMES}
      defaultProps={{ dataReferencia: DATA_REFERENCIA_PADRAO }}
      calculateMetadata={fixarData}
    />
  </>
);
