# Mini Putt Modern — Design Brainstorm

## Three stylistic approaches

| Theme Name | Very Brief Intro | Probability |
| --- | --- | --- |
| Cabinet Greenhouse | A tactile arcade-cabinet frame places the original course at centre stage, pairing warm off-white UI material with an intensely green felt playfield. It preserves early-web playfulness while improving legibility and control feedback. | 0.07 |
| Sunday Park Signage | A light, printed-wayfinding interpretation of a municipal miniature-golf park, using sun-faded colours and hand-painted directional forms. It favours relaxed outdoor nostalgia over digital game aesthetics. | 0.03 |
| Glass Scoreboard | A sharply minimal scoreboard-led interface with translucent panels and restrained technical typography. It would treat the physics simulation like a precision sport instrument. | 0.09 |

## Chosen approach — Cabinet Greenhouse

### Design Movement

**Contemporary arcade vernacular** with material cues from miniature-golf felt, embossed scorecards, and early-2000s browser games. The presentation must enhance the historic game without impersonating the original Flash interface.

### Core Principles

1. **Playfield first:** the course canvas dominates the composition; chrome remains narrow and useful.
2. **Tactile legibility:** controls look pressable, game values resemble scorecard ink, and physics feedback has a visible directional language.
3. **Modern restraint:** nostalgia comes from palette and materials, not fake CRT filters, clutter, or simulated glitches.
4. **Mobile equivalence:** mouse drag and touch drag are identical conceptual actions; keyboard actions remain fast and unanimated.

### Color Philosophy

The signature green communicates turf and forward momentum. Warm paper white prevents the supporting interface from becoming another dark arcade shell, while charcoal outlines recall a printed scorecard and maintain high contrast. A high-visibility red is reserved for the hole, reset warnings, and terminal state.

### Layout Paradigm

An **asymmetric cabinet strip**: a slim, stacked score rail sits beside a large horizontal course window on desktop. On narrow screens, it changes to a top scorecard and preserves the uninterrupted board aspect ratio. Content never competes with the playfield through large hero sections or generic card grids.

### Signature Elements

1. The **hole indicator** is a bold circular count badge with a flag-like notch.
2. The **power rail** is a vertical, segmented felt meter that responds during aiming.
3. The **stroke path** is a short, dashed trajectory preview with a compact arrowhead.

### Interaction Philosophy

The game reads direct manipulation: pull away from the ball, release to strike. The UI teaches only once through contextual helper text; then it retires. Buttons perform short physical press feedback and never interrupt a moving shot.

### Animation

Ball motion follows the real-time simulation and is the primary motion. Interface feedback is limited to 120–220 ms transform/opacity transitions, a brief flag pulse after a cup, and a restrained score reveal. Respect `prefers-reduced-motion` by disabling interface animation while leaving the game simulation functional.

### Typography System

Use a local system UI stack for the functional interface to keep the deliverable dependency-free. Use a heavy, rounded all-caps display treatment made from CSS letter-spacing and font weight for numeric counters; use a compact humanist sans style for body copy. Counters use tabular numerals and short labels. No external web fonts.

### Brand Essence

**Mini Putt Modern is a clean-room browser restoration for players who want an immediate, tactile version of a forgotten Flash mini-golf game.**

Personality: **tactile, brisk, unpretentious**.

### Brand Voice

Headlines are short and active; instructional copy is concrete and never promotional. CTAs name the physical action, not an abstract benefit.

> “Pull back. Find the line.”

> “New ball, same hole.”

### Wordmark & Logo

The mark is a **bold white golf ball cut by a dark diagonal putter line**, set inside a rounded-square field-green tile. The wordmark uses aggressively tracked uppercase text, with the double “T” in PUTT visually echoing two slim flagpoles.

### Signature Brand Color

**Cabinet Green — `#3E9A52`**.

## Style Decisions

- Non-game entry, fallback, and loading states must retain the Cabinet Greenhouse material system: Cabinet Green, warm paper, charcoal ink, tactile controls, and Mini Putt Modern voice. Default blue SaaS states are prohibited.
- The rounded-square ball-and-putter mark and tracked uppercase wordmark remain visible on every non-game state, so the restoration is never anonymous.
- Generic platform-error language is replaced with physical, game-native phrasing such as “Out of bounds” or “Opening the cabinet.”
