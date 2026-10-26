import { Composition } from "remotion";
import { Demo } from "./Demo";
import data from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DealPassportDemo"
        component={Demo}
        durationInFrames={data.durationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
