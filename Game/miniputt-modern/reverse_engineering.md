# Reverse-engineering notes — `miniputt_new.swf`

## Source fingerprint

| Item | Verified finding |
| --- | --- |
| File format | Compressed Macromedia Flash (`CWS`), Flash version 6 |
| Stage size | 550 × 400 px |
| Course label | `Classic Mini Putt` |
| Hole count | 18 |
| Stroke limit | 10 strokes per hole; the original automatically sinks/ends the ball at this threshold |
| Recovered media | 3 MP3 effects, 1 WAV, 1 bitmap PNG, 75 vector shapes, 5 timeline frames |

## Screen evidence

The exported frame 1 is a Flash preloader using a red fish silhouette. The exported frame 2 is the original start screen: a cartoon green mini-golf lane leads toward a Roman numeral **III** wordmark, flanked by a grey castle, a purple dinosaur, and a flying saucer. The exported frame 3 exposes single- through four-player choices and a ball-collision toggle; it credits **©2005 Psycho Goldfish Creative Media**. The exported frame 4 is a player-set-up screen with a name field and ball-colour chooser. The exported frame 5 is an 18-hole scorecard overlay branded **MINI PUTT CLASSIC**, displayed above the green felt course. It establishes the original’s bold primary-colour, physical tabletop-golf character.

The only extracted bitmap (`images/49.png`) is an 84 × 42 px green felt texture. It will be reused as the board material in the modern restoration. The original MP3 mapping has also been verified from SWF timeline labels: character `250` is **putt**, `251` is **sink**, and `252` is **tube**.

## Verified controller behavior

The main ball controller was recovered from `frame_4/PlaceObject2_38_3/CLIPACTIONRECORD onClipEvent(enterFrame).as`.

| Behavior | Original implementation evidence |
| --- | --- |
| Aiming | Pointer displacement from ball is divided by 4 and clamped to a magnitude of 60; five markers preview the direction. |
| Strike | Release converts the aiming vector into X/Y velocity and increments `strokes`. |
| Deceleration | Both velocity components are multiplied by `0.94` every frame. |
| Stop threshold | Once speed stays below `1.5` for more than 25 ticks, motion stops and control returns. |
| Cup rule | The ball drops only when it intersects a `hole` tile at speed below `10`; otherwise, it loses a randomized 0–20% of velocity. |
| Obstacles | Rectangular blocks, convex/concave curves, diagonal angles, slopes, tubes, warps, columns, and other balls are each handled by dedicated cases. |

## Reconstruction scope

The modern version will preserve the direct pull-back-and-release shot model, capped shot strength, rolling deceleration, low-speed cup capture, 10-stroke limit, 18-hole scorecard concept, and original sound effects where browser-safe. It is a clean-room reimplementation: ActionScript is analyzed as behavioral reference, not executed or embedded.
