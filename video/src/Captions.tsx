import React from "react";
import { useCurrentFrame } from "remotion";
import type { Caption } from "@remotion/captions";
export const Captions: React.FC<{
  captions: Caption[];
  lead: number;
  fps: number;
}> = ({ captions, lead, fps }) => {
  const f = useCurrentFrame(),
    ms = ((f - lead) / fps) * 1000;
  const cap = captions.find(
    (c, i) =>
      ms >= c.startMs && ms < (captions[i + 1]?.startMs ?? c.endMs + 250),
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 108,
        background: "#101010",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 100px 18px",
        zIndex: 100,
        color: "#FFF",
        fontFamily: "Inter",
        fontSize: 34,
        lineHeight: 1.28,
        textAlign: "center",
        fontWeight: 500,
      }}
    >
      {cap?.text ?? ""}
    </div>
  );
};
