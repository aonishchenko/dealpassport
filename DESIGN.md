---
name: Deal Passport
description: A private deal introduction with visible qualification and mutual consent.
colors:
  paper: "#fbf9f4"
  stone: "#f2f0ea"
  ink: "#1c1c19"
  olive: "#666352"
  rule: "#d8d5cb"
  success: "#4a5a32"
  danger: "#8f3a2b"
  muted: "#6f6c58"
  olive-hover: "#4e4c3f"
  feedback-progress: "#123d68"
  feedback-success: "#17503c"
  feedback-error: "#8c2432"
  feedback-text: "#fff"
  feedback-action-hover: "#f5e7ea"
  operation-meta: "#565448"
typography:
  display:
    fontFamily: '"Lora Variable", Lora, Georgia, serif'
    fontSize: "54px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Lora Variable", Lora, Georgia, serif'
    fontSize: "44px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Lora Variable", Lora, Georgia, serif'
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  subheading:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "14px"
    lineHeight: 1.8
  label:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.075em"
  feedback-body:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "20px"
    lineHeight: 1.5
  feedback-title:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.35
rounded:
  square: "0"
  dot: "50%"
spacing:
  compact: "8px"
  small: "12px"
  control: "14px"
  medium: "20px"
  section: "24px"
  panel: "28px"
  large: "32px"
  column: "64px"
components:
  button-primary:
    backgroundColor: "{colors.olive}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.olive-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.olive}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "14px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.stone}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.olive}"
    rounded: "{rounded.square}"
    padding: "8px 0"
  select:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "15px 42px 15px 14px"
  persona-navigation:
    backgroundColor: "transparent"
    textColor: "{colors.olive}"
    rounded: "{rounded.square}"
    padding: "9px 14px"
  status-label:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.olive}"
    rounded: "{rounded.square}"
    padding: "6px 8px"
  status-label-success:
    backgroundColor: "{colors.olive}"
    textColor: "{colors.paper}"
  room-panel:
    backgroundColor: "{colors.stone}"
    rounded: "{rounded.square}"
    padding: "28px"
  requirement-marker:
    textColor: "{colors.olive}"
    rounded: "{rounded.square}"
    size: "22px"
  feedback-progress:
    backgroundColor: "{colors.feedback-progress}"
    textColor: "{colors.feedback-text}"
    rounded: "{rounded.square}"
    padding: "26px"
    width: "880px"
  feedback-success:
    backgroundColor: "{colors.feedback-success}"
    textColor: "{colors.feedback-text}"
    rounded: "{rounded.square}"
    padding: "26px"
  feedback-error:
    backgroundColor: "{colors.feedback-error}"
    textColor: "{colors.feedback-text}"
    rounded: "{rounded.square}"
    padding: "26px"
  operation-history:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0 14px"
  session-strip:
    textColor: "{colors.ink}"
    padding: "14px 0"
---

# Design System: Deal Passport

## Overview

**Creative North Star: "The Quiet Deal Ledger"**

Deal Passport presents a private introduction as a calm, legible sequence of qualifications and choices. Warm paper, stone surfaces, olive typography and fine rules give the workflow the character of a carefully maintained deal ledger. Lora headings lend an editorial voice; Inter carries the compact operational detail.

The visual identity is already established. This document records the implementation in src/App.tsx and src/styles.css; docs/Deal_Passport_HackMeridian_Build_Spec.md remains the canonical product specification. State, synthetic-data disclosure and inspectable evidence shape the interface without turning technical detail into decoration.

**Key Characteristics:**

- Warm light surfaces and restrained olive emphasis.
- Square controls, fine rules and flat tonal depth.
- Serif headings paired with compact sans-serif operational text.
- Visible qualification, consent and disclosure state.

## Colors

The palette is warm, low-chroma and predominantly neutral. The frontmatter records the source values; semantic names below describe their use.

### Primary

- **Olive:** Headings, primary actions, selected requirements and the successful passport label.
- **Deep Olive:** Primary-button hover state.

### Neutral

- **Paper:** Page canvas and light text on olive actions.
- **Stone:** The room panel, credential selector, active persona, quiet status labels and empty evidence.
- **Ink:** Main text and selected persona text.
- **Rule:** Dividers, outlines and secondary-button borders.
- **Muted Olive:** Small supporting metadata and fine print.

Success green marks expiry, network and successful receipt indicators. Warning copy uses its observed warm tint locally; it is not a separate brand accent.

The user approved a component-specific exception to the main palette: **Progress Blue**, **Completion Green** and **Attention Red** make presentation feedback easy to read with **White Feedback Text**. These colors also identify running, successful and failed/rejected operation-history icons. **Operation Metadata** supplies readable supporting history text. Keep these colors within operational feedback and history; the paper, stone, olive and font identity stays intact. A completed negative test may use Completion Green because the test completed; its message and history outcome must still explicitly say rejected. Qualification is a separate state.

**The State Before Decoration Rule.** Use color, labels and icons to explain qualification or consent; never imply a verified state through decoration alone.

## Typography

**Display Font:** Lora Variable, with Lora / Georgia / serif fallbacks for headings. The brand and numeric price use the shipped Lora Variable / Georgia / serif stack.

**Body Font:** Inter Variable, with Inter / system-ui / sans-serif fallbacks. No separate monospace family is used; technical values use tabular numerals or wrapping where appropriate.

Lora supplies restrained editorial character. Inter keeps the operational interface compact, especially supporting explanations, receipts and requirements.

### Hierarchy

- **Display:** Welcome heading uses the display token, steps down to 44px at the intermediate breakpoint and 40px on mobile; mobile line height is 1.22.
- **Headline:** Deal heading uses the headline token and becomes 32px on mobile.
- **Title:** General section headings use the title token. Passport headings are 34px on desktop and 29px on mobile; the room heading is 24px / 1.35 on desktop and 26px on mobile.
- **Subheading:** Inter weight 600, with context-specific compact sizes for grouped information.
- **Body:** General paragraph token is the base. Workspace explanations commonly use 12–13px; introductory copy uses 16px on desktop. Paragraphs have a default maximum measure of 68ch, with narrower contextual limits.
- **Label:** Uppercase action labels use the label token. Field labels are 10px with 0.07em tracking; status labels are 9px with 0.09em tracking. Mobile supporting labels become smaller as recorded in the stylesheet.
- **Feedback:** High-contrast notices use the feedback-title and feedback-body tokens. On mobile these become 19px title and 16px body; line heights remain 1.35 and 1.5. This larger hierarchy serves demonstration-room readability.
- **History:** Operation summary is 19px / weight 600, and entry titles are 17px / weight 550 / line-height 1.5. Mobile sizes are 17px and 15px. Source/time/outcome metadata is 12px, becoming 11px on mobile.

## Layout

The main container is centered with a maximum width of 1248px, including horizontal padding of 28px. Mobile horizontal padding is 20px. The header is separated by a fine bottom rule and has an 88px minimum desktop height.

The desktop deal workspace pairs a flexible main column with a 342px room column and a 64px gap. At widths up to 1000px the room column becomes 310px with a 32px gap. At widths up to 760px, the workspace stacks the current task before the room requirements, with a 32px gap. The deal heading and price also stack. Header navigation becomes a full-width second row; the footer and session footer stack.

The welcome surface uses a 1.25:1 two-column composition with a 90px gap, reduced at the intermediate breakpoint. It becomes a single column on mobile. Its vertical spacing increases above 1500px. This composition belongs to the welcome surface; it is not a universal screen template.

Spacing is contextual rather than a rigid mathematical scale. Repeated 12px icon gaps, 14px control padding, 20–32px content intervals and fine horizontal rules provide the rhythm. Receipt rows wrap on mobile, and long technical values use overflow wrapping.

## Elevation & Depth

The implementation uses no box shadows. Paper and stone distinguish context; one-pixel rules separate adjacent content. Feedback is a fixed, centered notice 20px above the bottom edge, with an 880px width and a maximum width of the viewport minus 40px. Its internal content scrolls when it exceeds the smaller of 44vh or 360px. Mobile uses 12px bottom and side clearances and a maximum height of 46vh. Strong semantic fills provide contrast without introducing shadows or changing the rest of the interface.

**The Flat Ledger Rule.** Separate content with spacing, fine rules and stone surfaces. Keep the implemented interface free of shadows.

## Shapes

Buttons, selects, panels, status labels and requirement markers use square corners. Rules are one pixel. Only the small network indicator and working indicator are circular. Thin line icons use a stroke width of 1.6 and should remain visually quiet beside the text.

## Components

### Buttons

Compact, explicit actions with square corners. Primary actions use olive fill, paper text, an olive border and the uppercase label token. Secondary actions use a transparent fill and rule-colored border; hover introduces stone and an olive border. Text actions have no border, use 12px Inter at weight 500 and gain an underline on hover.

General buttons have a 44px minimum height. The persona and utility controls have explicit smaller overrides. Disabled buttons have 0.45 opacity and a not-allowed cursor. Focus uses a 2px olive outline with a 4px offset. Color and border transitions last 0.18s. There is no lift or scale animation.

### Chips

Status labels are informational, square stone tags with tracked uppercase type. A successful passport changes to olive fill and paper text; the text also describes the state. They are not interactive filter chips.

### Cards / Containers

The room panel is a stone surface with 28px desktop padding, 24px at the intermediate breakpoint and 26px on mobile. It aligns to the top of the workspace. The welcome preview also uses stone but has its own larger inner spacing. Main passport content stays on the paper canvas instead of becoming a nested card.

### Inputs / Fields

The shipped credential control is a native select, with a custom inline chevron and a visible external label. It has a stone fill, rule border, square corners and a 48px minimum height. Its font is 16px at all widths. Focus follows the shared outline. Supporting help sits beneath the field. There is no standalone text-input component in the current interface.

### Navigation

Header links are compact text with a fine underline border for hover and current page. Persona buttons use a transparent resting state and a stone fill, rule border and ink text for the pressed state. Preserve aria-current and aria-pressed state semantics. Mobile navigation remains visible and touch-operable.

### Requirements and disclosure

Four numbered square markers identify the room conditions. Each becomes an olive square with a paper check when satisfied. A separate primary action stays disabled until all requirements are satisfied and no operation is pending. Readiness and disclosure are distinct: protected fields show disclosure only when the dossier has actually been returned. The buyer’s exact balance remains private.

### Evidence and feedback

Evidence remains a flat ruled list with a status icon, action label, short technical metadata and optional external receipt link. Presentation feedback uses Progress Blue while working, Completion Green on completion and Attention Red when an action needs attention. White text, a clear heading and an icon or busy indicator communicate the state alongside color.

The notice has 26px padding and an 18px gap on desktop; mobile uses 18px padding and a 12px gap. Nonbusy notices have a 44px-square dismiss button. Its hover fill is translucent white, and feedback controls use a 3px white focus outline with a 3px offset. When the session is missing, an error can include a white recovery button with attention-red text and a pale hover fill. Error notices use alert semantics; progress and completion use status semantics.

Busy state uses a white 16px opacity-pulse indicator lasting 1.5s. The reduced-motion media query disables animation and transitions. A negative credential test can complete successfully while rejecting the credential; preserve that explicit distinction in the message.

### Operation history

A native details disclosure below the session strip opens while an operation is busy and returns to its collapsed default when idle; the user can also toggle it. It uses a fine bottom rule, a 44px-minimum summary and a stone scrollable list with a maximum height of 240px, reduced to 210px on mobile. The list is keyboard focusable. Entries are newest first, with a visible time, source and outcome, and transaction links only when there is an actual hash.

Source labels distinguish Demo server, Stellar Testnet and Browser-reported evidence. Never present a browser check as an onchain receipt. The explanatory copy states that private witness data is not logged. Running icons use Progress Blue, successes use Completion Green, and failed/rejected icons use Attention Red; words retain the exact outcome.

### Session and expiry

A ruled session strip shows a clock and live remaining time using tabular numerals. Its restart text action has a 44px minimum height and 14px text. The strip stacks on mobile, with countdown text reducing from 15px to 14px. An existing but unprepared session has an explicit finish-preparing recovery action, and a lost session can restart through the feedback recovery action.

Seller authority displays a 15px expiry line tied to the deal/session lifetime, with 18px vertical margins. Buyer proof access has its own expiry indicator and explanation: it ends at the current five-minute proof-window boundary or earlier when the deal ends, independently of the underlying issuer credential. Keep these lifetimes explicit rather than presenting one countdown as every credential’s validity.

## Do's and Don'ts

### Do:

- Do preserve the approved paper, stone, ink and olive palette with Inter and Lora.
- Do show requirements individually and pair state color with words or icons.
- Do keep keyboard focus visible and honor reduced-motion preferences.
- Do retain the difference between qualification, consent and actual disclosure.
- Do keep technical identifiers breakable and public receipt links inspectable.
- Do reserve the approved blue, green and red feedback colors for operational feedback and history.
- Do distinguish browser-reported checks, server actions and actual Testnet transactions.
- Do show session recovery and explain seller-authority expiry separately from buyer proof-window expiry.

### Don't:

- Don't introduce rounded cards, gradients or drop shadows into this flat system.
- Don't use color alone to communicate verification, failure or privacy.
- Don't add photography, logos or borrowed identity assets without an explicit brief.
- Don't replace the canonical product specification with a generated product document.

### Rejection feedback

Underfunded and expired credential checks use the crimson feedback fill with an X icon and **Credential rejected** heading. Rejected contract-policy checks use **Action rejected** on the same crimson fill. Green **Operation complete** feedback is reserved for successful product outcomes. Starting a new operation resets the notice kind, so a prior rejection cannot recolor the next success.
