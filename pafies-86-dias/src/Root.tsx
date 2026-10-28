import React from "react";
import { Composition } from "remotion";
import { FPS, FRAMES } from "./config";
import { Pafies86Dias } from "./Pafies86Dias";

export const RemotionRoot: React.FC = () => (
  <Composition id="Pafies86Dias" component={Pafies86Dias} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES} />
);
