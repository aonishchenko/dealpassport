import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
const key = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY;
if (!key) throw Error("Set the ElevenLabs key in the ignored project .env.");
const client = new ElevenLabsClient({ apiKey: key });
const voiceId = process.env.ELEVENLABS_VOICE_ID;
if (!voiceId)
  throw Error("Set ELEVENLABS_VOICE_ID in the ignored project .env.");
const scenes = JSON.parse(await fs.readFile("storyboard.json", "utf8"));
await fs.mkdir("public/voiceover", { recursive: true });
console.log(
  "Narration words:",
  scenes.reduce((n, s) => n + s.text.split(/\s+/).length, 0),
);
let next = 0;
const results = new Array(scenes.length);
async function worker() {
  while (next < scenes.length) {
    const i = next++,
      s = scenes[i],
      file = `public/voiceover/${s.id}.mp3`,
      alignmentFile = `public/voiceover/${s.id}.json`;
    let alignment;
    try {
      await fs.access(file);
      alignment = JSON.parse(await fs.readFile(alignmentFile, "utf8"));
    } catch {
      let r;
      try {
        r = await client.textToSpeech.convertWithTimestamps(voiceId, {
          text: s.text,
          modelId: "eleven_multilingual_v2",
          outputFormat: "mp3_44100_128",
          voiceSettings: {
            stability: 0.6,
            similarityBoost: 0.9,
            style: 0.1,
            speed: 1.05,
            useSpeakerBoost: true,
          },
          previousText: scenes[i - 1]?.text,
          nextText: scenes[i + 1]?.text,
          applyTextNormalization: "on",
        });
      } catch (e) {
        throw Error(
          `ElevenLabs narration failed for ${s.id}, HTTP ${e.statusCode ?? "unknown"}: ${String(
            e.message ?? "",
          )
            .replaceAll(key, "[redacted]")
            .slice(0, 350)}`,
        );
      }
      await fs.writeFile(file, Buffer.from(r.audioBase64, "base64"));
      alignment = r.normalizedAlignment || r.alignment;
      if (!alignment)
        throw Error("Narration returned without timing alignment.");
      await fs.writeFile(alignmentFile, JSON.stringify(alignment));
    }
    const duration = Number(
      execFileSync(
        process.env.FFPROBE_BIN || "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          file,
        ],
        { encoding: "utf8" },
      ).trim(),
    );
    results[i] = { ...s, audio: `voiceover/${s.id}.mp3`, duration, alignment };
    console.log(s.id, duration.toFixed(2) + "s");
  }
}
await Promise.all([worker(), worker()]);
await fs.writeFile(
  "narration.generated.json",
  JSON.stringify(results, null, 2),
);
console.log(
  "Total speech seconds:",
  results.reduce((n, s) => n + s.duration, 0).toFixed(2),
);
