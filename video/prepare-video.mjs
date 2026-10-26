import fs from "node:fs/promises";
const raw = JSON.parse(await fs.readFile("narration.generated.json", "utf8"));
const fps = 30,
  lead = 12,
  tail = 24;
let from = 0;
const scenes = raw.map((s, i) => {
  const a = s.alignment,
    chars = a.characters.join("");
  const starts = a.characterStartTimesSeconds,
    ends = a.characterEndTimesSeconds;
  const words = [];
  let st = 0;
  for (let n = 0; n <= a.characters.length; n++)
    if (n === a.characters.length || /\s/.test(a.characters[n])) {
      if (n > st)
        words.push({
          text: chars.slice(st, n),
          startMs: starts[st] * 1000,
          endMs: ends[n - 1] * 1000,
          timestampMs: null,
          confidence: null,
        });
      st = n + 1;
    }
  const captions = [];
  let group = [];
  const flush = () => {
    if (group.length) {
      captions.push({
        text: group
          .map((w) => w.text)
          .join(" ")
          .replaceAll("D one", "D1")
          .replaceAll("R two", "R2"),
        startMs: group[0].startMs,
        endMs: group.at(-1).endMs,
        timestampMs: null,
        confidence: null,
      });
      group = [];
    }
  };
  for (const w of words) {
    if (
      group.length &&
      group.map((x) => x.text).join(" ").length + w.text.length > 68
    )
      flush();
    group.push(w);
    if (/[.!?]$/.test(w.text) && group.map((x) => x.text).join(" ").length > 22)
      flush();
  }
  flush();
  const cue = (str, fallback) => {
    const ix = chars.toLowerCase().indexOf(str.toLowerCase());
    return ix < 0 ? fallback : starts[ix] + lead / fps;
  };
  const cues = {
    click: cue("clicks Prove eligibility", 7),
    generating: cue("browser builds", 10),
    history: cue("history shows", 13),
    verified: cue("Stellar checks", 18),
    result: cue("seller learns", 24),
    sellerAttests: cue("reviewer attests", 5),
    sellerAfter: cue("After confirmation", 9),
    buyerConsent: cue("buyer consents", 4),
    sellerConsent: cue("seller consents", 6),
    ready: cue("Only when", 8),
    dossierPrivate: cue("while the buyer", 8),
    withdraw: cue("Withdrawing", 12),
    external: cue("Didit", 10),
    zk: cue("Local Rust", 20),
    chain: cue("Stellar", 24),
    flow: cue("Evidence becomes", 26),
    postMvp: cue("These integrations", 30),
  };
  const durationInFrames =
    Math.ceil(s.duration * fps) + lead + tail + (i === raw.length - 1 ? 60 : 0);
  const out = {
    id: s.id,
    title: s.title,
    kind: s.kind,
    slide: s.slide,
    text: s.text,
    audio: s.audio,
    audioDuration: s.duration,
    from,
    durationInFrames,
    captions,
    words,
    cues,
  };
  from += durationInFrames;
  return out;
});
if (from > 180 * fps) throw Error(`Video exceeds three minutes: ${from / fps}`);
const assets = {};
for (const file of await fs.readdir("public/screens"))
  if (file.endsWith(".png")) {
    const bytes = await fs.readFile("public/screens/" + file);
    const m = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    assets[file.replace(".png", "")] = {
      src: "screens/" + file,
      width: m.width,
      height: m.height,
    };
  }
await fs.writeFile(
  "src/timeline.json",
  JSON.stringify(
    {
      fps,
      width: 1920,
      height: 1080,
      durationInFrames: from,
      lead,
      scenes,
      assets,
    },
    null,
    2,
  ),
);
let srt = "";
let n = 1;
const ts = (ms) => {
  const t = Math.round(ms),
    h = Math.floor(t / 3600000),
    m = Math.floor(t / 60000) % 60,
    s = Math.floor(t / 1000) % 60,
    x = t % 1000;
  return (
    [h, m, s].map((v) => String(v).padStart(2, "0")).join(":") +
    "," +
    String(x).padStart(3, "0")
  );
};
for (const s of scenes)
  for (const c of s.captions) {
    const offset = ((s.from + lead) / fps) * 1000;
    srt += `${n++}\n${ts(offset + c.startMs)} --> ${ts(offset + c.endMs)}\n${c.text}\n\n`;
  }
await fs.mkdir("../output/demo", { recursive: true });
await fs.writeFile("../output/demo/Deal_Passport_Demo_ElevenLabs.srt", srt);
console.log(
  JSON.stringify({
    durationSeconds: from / fps,
    frames: from,
    scenes: scenes.map((s) => ({
      id: s.id,
      from: s.from / fps,
      duration: s.durationInFrames / fps,
    })),
    assets: Object.keys(assets),
  }),
);
