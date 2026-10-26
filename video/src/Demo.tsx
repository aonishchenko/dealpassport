import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import data from "./timeline.json";
import { Captions } from "./Captions";
loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter.woff2"),
  weight: "100 900",
});
type Box = { x: number; y: number; w: number; h: number };
type Scene = (typeof data.scenes)[number];
const paper = "#FBF9F4",
  yellow = "#FDDA24",
  ink = "#161616";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const assets = data.assets as Record<
  string,
  { src: string; width: number; height: number }
>;
const Ring: React.FC<{ box: Box; start?: number; darken?: boolean }> = ({
  box,
  start = 0,
  darken = false,
}) => {
  const f = useCurrentFrame() - start;
  const a = interpolate(f, [0, 9], [0, 1], { ...clamp, easing: ease });
  const pulse = f < 50 ? 1 + 0.018 * Math.sin(f / 5) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x - 6,
        top: box.y - 6,
        width: box.w + 12,
        height: box.h + 12,
        border: "4px solid " + yellow,
        borderRadius: 5,
        opacity: a,
        transform: `scale(${pulse})`,
        boxShadow: darken ? "0 0 0 4000px #14141455" : "0 0 0 2px #211E1799",
        background: "#FDDA2409",
        pointerEvents: "none",
      }}
    />
  );
};
const Cursor: React.FC<{ x: number; y: number; at: number }> = ({
  x,
  y,
  at,
}) => {
  const f = useCurrentFrame(),
    p = interpolate(f, [at - 18, at], [0, 1], { ...clamp, easing: ease }),
    a = f >= at - 22 && f < at + 24 ? 1 : 0,
    r = interpolate(f, [at, at + 20], [3, 42], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x + 120 * (1 - p),
        top: y + 95 * (1 - p),
        opacity: a,
        zIndex: 8,
      }}
    >
      <svg width="42" height="52" viewBox="0 0 42 52">
        <path
          d="M3 2 L35 29 L21 30 L15 47 Z"
          fill="white"
          stroke="#171717"
          strokeWidth="3"
        />
      </svg>
      {f >= at && (
        <div
          style={{
            position: "absolute",
            left: -r,
            top: -r,
            width: r * 2,
            height: r * 2,
            border: "4px solid " + yellow,
            borderRadius: "50%",
            opacity: 1 - (f - at) / 22,
          }}
        />
      )}
    </div>
  );
};
const Crop: React.FC<{
  name: string;
  box: Box;
  x: number;
  y: number;
  width: number;
  maxHeight?: number;
}> = ({ name, box, x, y, width, maxHeight = 470 }) => {
  const a = assets[name],
    s = Math.min(width / box.w, maxHeight / box.h),
    w = box.w * s,
    h = box.h * s;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: "hidden",
        border: "3px solid " + yellow,
        borderRadius: 6,
        background: paper,
      }}
    >
      <Img
        src={staticFile(a.src)}
        style={{
          position: "absolute",
          width: a.width * s,
          height: a.height * s,
          left: -box.x * s,
          top: -box.y * s,
          maxWidth: "none",
        }}
      />
    </div>
  );
};
const Screen: React.FC<{
  name: string;
  box?: Box;
  click?: { x: number; y: number; at: number };
}> = ({ name, box, click }) => {
  const a = assets[name],
    s = Math.min(1160 / a.width, 800 / a.height),
    x = 60 + (1160 - a.width * s) / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 140,
        width: a.width,
        height: a.height,
        transform: `scale(${s})`,
        transformOrigin: "top left",
      }}
    >
      <Img
        src={staticFile(a.src)}
        style={{ width: a.width, height: a.height }}
      />
      {box && <Ring box={box} />} {click && <Cursor {...click} />}
    </div>
  );
};
const Detail: React.FC<{
  title: string;
  line: string;
  name: string;
  box: Box;
}> = ({ title, line, name, box }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 1270,
        top: 154,
        width: 570,
        fontSize: 36,
        fontWeight: 700,
        lineHeight: 1.15,
        color: ink,
      }}
    >
      {title}
    </div>
    <Crop name={name} box={box} x={1270} y={280} width={580} maxHeight={420} />
    <div
      style={{
        position: "absolute",
        left: 1270,
        top: 760,
        width: 560,
        fontSize: 30,
        lineHeight: 1.35,
        color: "#666352",
        whiteSpace: "pre-line",
      }}
    >
      {line}
    </div>
  </>
);
const AppHeader: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 110,
      background: ink,
      color: "white",
      padding: "18px 60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: yellow,
          letterSpacing: 2,
          marginBottom: 5,
        }}
      >
        DEAL PASSPORT / THE LIVE PRODUCT
      </div>
      <div style={{ fontSize: 36, fontWeight: 600 }}>{title}</div>
    </div>
    <div
      style={{
        fontSize: 19,
        textAlign: "right",
        lineHeight: 1.4,
        color: "#E8E4DA",
      }}
    >
      Stellar Testnet
      <br />
      Synthetic credentials. Real verification.
    </div>
  </div>
);
const FlowSteps: React.FC<{ frame: number; verified?: boolean }> = ({
  frame,
  verified = false,
}) => {
  const labels = [
    "Private browser proof",
    "Stellar transaction",
    "Confirmed status",
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 95,
        top: 650,
        width: 1100,
        display: "flex",
        gap: 24,
      }}
    >
      {labels.map((l, i) => {
        const on = verified || i < 2;
        return (
          <div
            key={l}
            style={{
              flex: 1,
              borderTop: `5px solid ${on ? yellow : "#D8D5CB"}`,
              paddingTop: 22,
              fontSize: 27,
              lineHeight: 1.3,
              fontWeight: 600,
              color: on ? ink : "#888",
            }}
          >
            <div style={{ fontSize: 17, color: "#666352", marginBottom: 10 }}>
              STEP {i + 1}
            </div>
            {l}
            {i === 1 && !verified && (
              <div
                style={{
                  height: 8,
                  width: 8,
                  borderRadius: "50%",
                  background: "#245D99",
                  marginTop: 15,
                  opacity: 0.5 + 0.5 * Math.sin(frame / 10),
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
const Live: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame(),
    t = frame / data.fps,
    c = scene.cues;
  let content: React.ReactNode;
  if (scene.id === "deal") {
    content = (
      <>
        <div
          style={{
            position: "absolute",
            left: 95,
            top: 170,
            width: 1730,
            height: 270,
            overflow: "hidden",
            borderBottom: "2px solid #D8D5CB",
          }}
        >
          <Img
            src={staticFile(assets["deal-overview"].src)}
            style={{
              position: "absolute",
              width: 2430,
              height: 1367,
              left: -410,
              top: -130,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 115,
            top: 560,
            width: 1040,
            fontSize: 50,
            lineHeight: 1.25,
            fontWeight: 600,
          }}
        >
          A shared deal policy.
          <br />
          Four requirements before disclosure.
        </div>
        <Crop
          name="buyer-before"
          box={{ x: 868, y: 190, w: 310, h: 240 }}
          x={1310}
          y={535}
          width={480}
          maxHeight={350}
        />
        <Ring box={{ x: 98, y: 175, w: 1722, h: 270 }} />
      </>
    );
  } else if (scene.id === "seller") {
    const after = t >= c.sellerAfter,
      name = after ? "seller-attested" : "seller-before";
    content = (
      <>
        <Screen
          name={name}
          box={
            after
              ? { x: 872, y: 255, w: 300, h: 75 }
              : { x: 0, y: 607, w: 278, h: 55 }
          }
          click={
            !after
              ? { x: 130, y: 635, at: Math.round(c.sellerAttests * data.fps) }
              : undefined
          }
        />
        <Detail
          title={after ? "Authority attested" : "A claim for this property"}
          line={
            "The address stays offchain.\nAuthority is specific to this deal."
          }
          name={name}
          box={
            after
              ? { x: 868, y: 255, w: 310, h: 80 }
              : { x: 0, y: 600, w: 305, h: 77 }
          }
        />
      </>
    );
  } else if (scene.id === "buyer") {
    const progress = t >= c.generating && t < c.verified,
      after = t >= c.verified;
    if (progress) {
      const name = t > c.history + 2 ? "proof-confirmed-log" : "proof-progress";
      content = (
        <>
          <Screen name={name} box={{ x: 5, y: 120, w: 1174, h: 150 }} />
          <Detail
            title="After Prove eligibility"
            line={
              "Private evidence stays in the browser.\nOnly the proof and public inputs reach Stellar."
            }
            name={name}
            box={{ x: 5, y: 118, w: 850, h: 205 }}
          />
          <FlowSteps frame={frame} verified={name === "proof-confirmed-log"} />
        </>
      );
    } else {
      const name = after ? "buyer-qualified" : "buyer-before";
      content = (
        <>
          <Screen
            name={name}
            box={
              after
                ? { x: 868, y: 200, w: 310, h: 77 }
                : { x: 0, y: 491, w: 198, h: 62 }
            }
            click={
              !after
                ? { x: 97, y: 522, at: Math.round(c.click * data.fps) }
                : undefined
            }
          />
          <Detail
            title={after ? "Qualified onchain" : "Generate the private proof"}
            line={
              after
                ? "The threshold is satisfied.\nThe exact balance stays private."
                : "An issuer-backed credential.\nA proof bound to this deal."
            }
            name={name}
            box={
              after
                ? { x: 635, y: 116, w: 160, h: 42 }
                : { x: 0, y: 489, w: 220, h: 72 }
            }
          />
        </>
      );
    }
  } else if (scene.id === "consent") {
    const phase =
      t < c.buyerConsent
        ? 0
        : t < c.sellerConsent
          ? 1
          : t < c.ready + 1.6
            ? 2
            : 3;
    const name = [
      "buyer-qualified",
      "buyer-consented",
      "seller-before-consent",
      "seller-consented",
    ][phase];
    const box =
      phase < 2
        ? { x: 0, y: 779, w: 240, h: 60 }
        : phase === 2
          ? { x: 0, y: 804, w: 275, h: 66 }
          : { x: 868, y: 163, w: 310, h: 244 };
    content = (
      <>
        <Screen
          name={name}
          box={phase === 3 ? { x: 868, y: 163, w: 310, h: 244 } : box}
        />
        <Detail
          title={
            [
              "Qualified does not mean disclosed",
              "The buyer consents",
              "The seller consents",
              "Both parties are ready",
            ][phase]
          }
          line={
            "Both passports must be current.\nBoth permissions must be present."
          }
          name={name}
          box={box}
        />
      </>
    );
  } else {
    const last = t >= c.withdraw,
      name = "dossier-open";
    content = (
      <>
        <Screen
          name={name}
          box={
            last
              ? { x: 0, y: 668, w: 228, h: 53 }
              : { x: 868, y: 527, w: 310, h: 150 }
          }
        />
        <Detail
          title={
            last ? "Consent can be withdrawn" : "Approved details are disclosed"
          }
          line={
            "The backend rechecks current policy.\nThe buyer’s exact balance stays private."
          }
          name={name}
          box={
            last
              ? { x: 0, y: 666, w: 235, h: 59 }
              : { x: 868, y: 530, w: 310, h: 147 }
          }
        />
      </>
    );
  }
  return (
    <AbsoluteFill style={{ background: paper, fontFamily: "Inter" }}>
      <AppHeader title={scene.title} />
      {content}
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 116,
          fontSize: 16,
          color: "#777466",
        }}
      >
        Recorded from the live MVP / Operation sequence condensed
      </div>
    </AbsoluteFill>
  );
};
const Slide: React.FC<{ scene: Scene }> = ({ scene }) => {
  const f = useCurrentFrame(),
    t = f / data.fps,
    c = scene.cues;
  let box: Box | undefined;
  if (scene.id === "problem")
    box =
      t < 12
        ? { x: 122, y: 548, w: 1110, h: 54 }
        : { x: 122, y: 496, w: 1110, h: 54 };
  if (scene.id === "solution")
    box =
      t < 7
        ? { x: 122, y: 497, w: 1110, h: 52 }
        : t < 13
          ? { x: 122, y: 550, w: 1110, h: 52 }
          : { x: 122, y: 602, w: 1110, h: 52 };
  if (scene.id === "architecture")
    box =
      t < c.external
        ? { x: 465, y: 590, w: 722, h: 284 }
        : t < c.zk
          ? { x: 465, y: 376, w: 722, h: 166 }
          : t < c.chain
            ? { x: 1283, y: 376, w: 519, h: 175 }
            : t < c.flow
              ? { x: 1283, y: 618, w: 519, h: 257 }
              : undefined;
  const flow = scene.id === "architecture" && t >= c.flow;
  const dot = flow
    ? interpolate(
        f,
        [c.flow * data.fps, (c.flow + 6) * data.fps],
        [0, 1],
        clamp,
      )
    : 0;
  const points = [
    [930, 215],
    [930, 290],
    [1380, 350],
    [1440, 350],
    [1440, 125],
    [1520, 125],
    [1840, 230],
    [1840, 330],
  ];
  const pi = Math.min(points.length - 2, Math.floor(dot * (points.length - 1))),
    m = dot * (points.length - 1) - pi;
  const point = [
    points[pi][0] + (points[pi + 1][0] - points[pi][0]) * m,
    points[pi][1] + (points[pi + 1][1] - points[pi][1]) * m,
  ];
  return (
    <AbsoluteFill style={{ background: "#101010" }}>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 0,
          width: 1920,
          height: 1080,
          transform: "scale(.9)",
          transformOrigin: "top left",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(`slides/slide-${scene.slide}.png`)}
          style={{ width: 1920, height: 1080 }}
        />
        {box && <Ring box={box} />}{" "}
        {scene.id === "architecture" && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 720,
              height: 76,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingRight: 96,
              fontFamily: "Inter",
              fontSize: 20,
              fontWeight: 700,
              color: yellow,
              background: "#101010",
            }}
          >
            PRODUCTION PLAN / POST-MVP
          </div>
        )}
        {flow && (
          <div
            style={{
              position: "absolute",
              left: 96 + point[0] * (1728 / 2200) - 10,
              top: 365 + point[1] * (1728 / 2200) - 10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: yellow,
              boxShadow: "0 0 0 6px #10101077",
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
const Chapter: React.FC<{ scene: Scene }> = ({ scene }) => {
  const f = useCurrentFrame(),
    opacity = Math.min(
      interpolate(f, [0, 12], [0, 1], clamp),
      interpolate(
        f,
        [scene.durationInFrames - 12, scene.durationInFrames],
        [1, 0],
        clamp,
      ),
    );
  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.kind === "slide" ? (
        <Slide scene={scene} />
      ) : (
        <Live scene={scene} />
      )}
      <Sequence from={data.lead} premountFor={30}>
        <Audio src={staticFile(scene.audio)} />
      </Sequence>
      <Captions captions={scene.captions} lead={data.lead} fps={data.fps} />
    </AbsoluteFill>
  );
};
export const Demo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: ink, fontFamily: "Inter" }}>
      {data.scenes.map((s) => (
        <Sequence
          key={s.id}
          from={s.from}
          durationInFrames={s.durationInFrames}
          premountFor={30}
        >
          <Chapter scene={s} />
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: (1920 * f) / data.durationInFrames,
          height: 5,
          background: yellow,
          zIndex: 120,
        }}
      />
    </AbsoluteFill>
  );
};
