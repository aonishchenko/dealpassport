import fs from "node:fs/promises";
import { spawnSync, execFileSync } from "node:child_process";
const ffmpeg = process.env.FFMPEG_BIN || "ffmpeg",
  ffprobe = process.env.FFPROBE_BIN || "ffprobe";
const input =
  process.argv[2] || "../output/demo/Deal_Passport_Demo_Remotion_raw.mp4";
const output =
  process.argv[3] || "../output/demo/Deal_Passport_Demo_ElevenLabs.mp4";
const pass = spawnSync(
  ffmpeg,
  [
    "-hide_banner",
    "-i",
    input,
    "-af",
    "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf8" },
);
if (pass.status !== 0) throw Error("Audio loudness measurement failed.");
const match = pass.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
if (!match) throw Error("Loudness metrics missing.");
const m = JSON.parse(match[0]);
const filter = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
const result = spawnSync(
  ffmpeg,
  [
    "-y",
    "-hide_banner",
    "-i",
    input,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-c:v",
    "copy",
    "-af",
    filter,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    output,
  ],
  { encoding: "utf8" },
);
if (result.status !== 0) throw Error("Final audio encoding failed.");
const info = JSON.parse(
  execFileSync(
    ffprobe,
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", output],
    { encoding: "utf8" },
  ),
);
if (Number(info.format.duration) > 180)
  throw Error("Demo exceeds three minutes.");
console.log(
  JSON.stringify(
    {
      file: output,
      seconds: Number(info.format.duration),
      bytes: (await fs.stat(output)).size,
      video: info.streams.find((s) => s.codec_type === "video")?.codec_name,
      audio: info.streams.find((s) => s.codec_type === "audio")?.codec_name,
    },
    null,
    2,
  ),
);
