# Deal Passport demo video

Remotion composition for the 1920×1080, 30 fps product walkthrough. It starts with PMF slide 3, continues to solution slide 2, demonstrates the real app's seller/proof/consent/disclosure flow with fixed screen captures and animated focus areas, then explains production architecture slide 6. There is no scrolling in the video. Captions use ElevenLabs character alignment and the `Caption` format from `@remotion/captions`.

## Build

```sh
cd video
npm ci
# Generate narration, using values in the ignored root .env:
# ELEVENLABS_API_KEY (ELEVENLABS_KEY is also supported)
# ELEVENLABS_VOICE_ID
npm run narrate
npm run prepare
npm run check
npm run render
npm run finalize
```

FFmpeg and ffprobe must be on PATH. On macOS, an installed Chrome can be used by setting `REMOTION_BROWSER_EXECUTABLE` to its executable path. Otherwise Remotion manages its browser. Rendering and audio normalization write local files in `output/demo/`. The final MP4 uses H.264 with 4:2:0 color, AAC and fast-start metadata. Regular PNG frame capture is enabled because shared-memory capture produced intermittent tiled frames in this environment. Finalization preserves the rendered video and normalizes the narration in two passes.

The narration generation uses the official ElevenLabs SDK with `eleven_multilingual_v2`, the supplied voice ID, and adjacent-scene text for continuity. Voice audio, raw alignment output, API keys and rendered videos stay ignored. Existing generated audio is reused to avoid duplicate paid requests. Delete only the relevant local audio/alignment pair to deliberately regenerate a chapter.

## Captures and claim boundaries

`public/screens` contains screenshots from the deployed MVP using synthetic data and genuine Stellar Testnet transactions. The main proof, both consent operations and protected dossier were captured from one deal on 26 October 2026, ending at 05:56 UTC. A five-minute proof epoch limits capture time. The recording sequence is condensed for narration; it is not a real-time performance benchmark.

The working product still uses the current proving dependencies. The last chapter explicitly describes the **post-MVP production plan**, including provider integrations and the Rust/Arkworks migration. It does not claim those integrations or Mainnet deployment are implemented.

`public/slides` is rendered from the approved pitch. Its generated narrative artwork is attributed in `docs/pitch-assets/PROMPTS.md`. The architecture remains unchanged. No music or stock footage is used. Application dependencies are separate from this optional video-authoring toolchain; their licenses and the licenses of the selected tools continue to apply.
