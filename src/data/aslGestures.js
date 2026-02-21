/**
 * ASL Alphabet Gesture Definitions
 * Using fingerpose GestureDescription API
 *
 * Each letter is defined by:
 *  - Which fingers are curled (FullCurl, HalfCurl, NoCurl)
 *  - Which direction each finger points
 *
 * J and Z are excluded — they require motion (drawn in the air)
 */

import {
  GestureDescription,
  Finger,
  FingerCurl,
  FingerDirection,
} from 'fingerpose';

// ─── Helpers ────────────────────────────────────────────────────────────────

function allCurled(gesture, exceptions = []) {
  [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky].forEach(f => {
    if (!exceptions.includes(f)) {
      gesture.addCurl(f, FingerCurl.FullCurl, 1.0);
    }
  });
}

// ─── A ───────────────────────────────────────────────────────────────────────
// Closed fist, thumb rests beside index finger (not tucked over)
export const A_Gesture = new GestureDescription('A');
A_Gesture.addCurl(Finger.Thumb,  FingerCurl.NoCurl,   1.0);
A_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
A_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
A_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
A_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
A_Gesture.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 1.0);
A_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.9);

// ─── B ───────────────────────────────────────────────────────────────────────
// Four fingers straight up, thumb folded across palm
export const B_Gesture = new GestureDescription('B');
B_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
B_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
B_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
B_Gesture.addCurl(Finger.Ring,   FingerCurl.NoCurl,    1.0);
B_Gesture.addCurl(Finger.Pinky,  FingerCurl.NoCurl,    1.0);
B_Gesture.addDirection(Finger.Index,  FingerDirection.VerticalUp, 1.0);
B_Gesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);
B_Gesture.addDirection(Finger.Ring,   FingerDirection.VerticalUp, 1.0);
B_Gesture.addDirection(Finger.Pinky,  FingerDirection.VerticalUp, 1.0);

// ─── C ───────────────────────────────────────────────────────────────────────
// All fingers curved in a C shape
export const C_Gesture = new GestureDescription('C');
C_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl, 1.0);
C_Gesture.addCurl(Finger.Index,  FingerCurl.HalfCurl, 1.0);
C_Gesture.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
C_Gesture.addCurl(Finger.Ring,   FingerCurl.HalfCurl, 1.0);
C_Gesture.addCurl(Finger.Pinky,  FingerCurl.HalfCurl, 1.0);
C_Gesture.addDirection(Finger.Index,  FingerDirection.DiagonalUpRight, 1.0);
C_Gesture.addDirection(Finger.Pinky,  FingerDirection.DiagonalUpRight, 0.9);

// ─── D ───────────────────────────────────────────────────────────────────────
// Index finger points up, other fingers curl to touch thumb (making circle)
export const D_Gesture = new GestureDescription('D');
D_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl,  1.0);
D_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
D_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
D_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
D_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
D_Gesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);

// ─── E ───────────────────────────────────────────────────────────────────────
// All fingers curl down like a claw, thumb tucked under
export const E_Gesture = new GestureDescription('E');
E_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl,  1.0);
E_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
E_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
E_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
E_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
E_Gesture.addDirection(Finger.Thumb,  FingerDirection.HorizontalRight, 1.0);
E_Gesture.addDirection(Finger.Thumb,  FingerDirection.DiagonalUpRight, 0.9);

// ─── F ───────────────────────────────────────────────────────────────────────
// Index and thumb touch making a circle, other three fingers up
export const F_Gesture = new GestureDescription('F');
F_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl,  1.0);
F_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
F_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
F_Gesture.addCurl(Finger.Ring,   FingerCurl.NoCurl,    1.0);
F_Gesture.addCurl(Finger.Pinky,  FingerCurl.NoCurl,    1.0);
F_Gesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);
F_Gesture.addDirection(Finger.Ring,   FingerDirection.VerticalUp, 1.0);
F_Gesture.addDirection(Finger.Pinky,  FingerDirection.VerticalUp, 1.0);

// ─── G ───────────────────────────────────────────────────────────────────────
// Index points sideways, thumb points out parallel (like pointing a gun sideways)
export const G_Gesture = new GestureDescription('G');
G_Gesture.addCurl(Finger.Thumb,  FingerCurl.NoCurl,    1.0);
G_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
G_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
G_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
G_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
G_Gesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft,  1.0);
G_Gesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.9);
G_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft,  1.0);
G_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.9);

// ─── H ───────────────────────────────────────────────────────────────────────
// Index and middle point sideways together
export const H_Gesture = new GestureDescription('H');
H_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
H_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
H_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
H_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
H_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
H_Gesture.addDirection(Finger.Index,  FingerDirection.HorizontalLeft,  1.0);
H_Gesture.addDirection(Finger.Index,  FingerDirection.HorizontalRight, 0.9);
H_Gesture.addDirection(Finger.Middle, FingerDirection.HorizontalLeft,  1.0);
H_Gesture.addDirection(Finger.Middle, FingerDirection.HorizontalRight, 0.9);

// ─── I ───────────────────────────────────────────────────────────────────────
// Pinky up, all others curled (pinky promise / "I love you" minus thumb)
export const I_Gesture = new GestureDescription('I');
I_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
I_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
I_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
I_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
I_Gesture.addCurl(Finger.Pinky,  FingerCurl.NoCurl,    1.0);
I_Gesture.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 1.0);

// ─── K ───────────────────────────────────────────────────────────────────────
// Index up, middle angled forward, thumb between index and middle
export const K_Gesture = new GestureDescription('K');
K_Gesture.addCurl(Finger.Thumb,  FingerCurl.NoCurl,    1.0);
K_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
K_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
K_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
K_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
K_Gesture.addDirection(Finger.Index,  FingerDirection.VerticalUp,        1.0);
K_Gesture.addDirection(Finger.Middle, FingerDirection.DiagonalUpRight,   1.0);
K_Gesture.addDirection(Finger.Thumb,  FingerDirection.DiagonalUpRight,   1.0);

// ─── L ───────────────────────────────────────────────────────────────────────
// L shape: index up, thumb out to side
export const L_Gesture = new GestureDescription('L');
L_Gesture.addCurl(Finger.Thumb,  FingerCurl.NoCurl,    1.0);
L_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
L_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
L_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
L_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
L_Gesture.addDirection(Finger.Index, FingerDirection.VerticalUp,      1.0);
L_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 1.0);
L_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft,  0.9);

// ─── M ───────────────────────────────────────────────────────────────────────
// Three fingers (index, middle, ring) folded over thumb
export const M_Gesture = new GestureDescription('M');
M_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl,  1.0);
M_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
M_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
M_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
M_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
M_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 1.0);

// ─── N ───────────────────────────────────────────────────────────────────────
// Two fingers (index, middle) folded over thumb — like M but only 2 fingers
export const N_Gesture = new GestureDescription('N');
N_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl,  1.0);
N_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
N_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
N_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
N_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
// N and M are very similar — differentiated in post-processing by thumb position

// ─── O ───────────────────────────────────────────────────────────────────────
// All fingers curve to meet thumb, making an O shape
export const O_Gesture = new GestureDescription('O');
O_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl, 1.0);
O_Gesture.addCurl(Finger.Index,  FingerCurl.HalfCurl, 1.0);
O_Gesture.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
O_Gesture.addCurl(Finger.Ring,   FingerCurl.HalfCurl, 1.0);
O_Gesture.addCurl(Finger.Pinky,  FingerCurl.HalfCurl, 1.0);
O_Gesture.addDirection(Finger.Index,  FingerDirection.DiagonalUpRight, 1.0);
O_Gesture.addDirection(Finger.Middle, FingerDirection.DiagonalUpRight, 1.0);

// ─── R ───────────────────────────────────────────────────────────────────────
// Index and middle fingers crossed (approximated as both up, close together)
export const R_Gesture = new GestureDescription('R');
R_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
R_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
R_Gesture.addCurl(Finger.Middle, FingerCurl.HalfCurl,  1.0);
R_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
R_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
R_Gesture.addDirection(Finger.Index,  FingerDirection.VerticalUp, 1.0);
R_Gesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 0.9);

// ─── S ───────────────────────────────────────────────────────────────────────
// Closed fist, thumb wraps over fingers (like A but thumb goes over not to side)
export const S_Gesture = new GestureDescription('S');
S_Gesture.addCurl(Finger.Thumb,  FingerCurl.HalfCurl,  1.0);
S_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
S_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
S_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
S_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
S_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 1.0);
S_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft,  0.9);

// ─── T ───────────────────────────────────────────────────────────────────────
// Thumb tucked between index and middle fingers
export const T_Gesture = new GestureDescription('T');
T_Gesture.addCurl(Finger.Thumb,  FingerCurl.NoCurl,    1.0);
T_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
T_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
T_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
T_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
T_Gesture.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 1.0);
T_Gesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp,      0.9);

// ─── U ───────────────────────────────────────────────────────────────────────
// Index and middle up together side-by-side, rest curled
export const U_Gesture = new GestureDescription('U');
U_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
U_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
U_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
U_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
U_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
U_Gesture.addDirection(Finger.Index,  FingerDirection.VerticalUp, 1.0);
U_Gesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);

// ─── V ───────────────────────────────────────────────────────────────────────
// Peace sign — index and middle up and spread apart
export const V_Gesture = new GestureDescription('V');
V_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
V_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
V_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
V_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
V_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
V_Gesture.addDirection(Finger.Index,  FingerDirection.DiagonalUpLeft,  1.0);
V_Gesture.addDirection(Finger.Index,  FingerDirection.VerticalUp,      0.9);
V_Gesture.addDirection(Finger.Middle, FingerDirection.DiagonalUpRight, 1.0);
V_Gesture.addDirection(Finger.Middle, FingerDirection.VerticalUp,      0.9);

// ─── W ───────────────────────────────────────────────────────────────────────
// Three fingers up: index, middle, ring
export const W_Gesture = new GestureDescription('W');
W_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
W_Gesture.addCurl(Finger.Index,  FingerCurl.NoCurl,    1.0);
W_Gesture.addCurl(Finger.Middle, FingerCurl.NoCurl,    1.0);
W_Gesture.addCurl(Finger.Ring,   FingerCurl.NoCurl,    1.0);
W_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
W_Gesture.addDirection(Finger.Index,  FingerDirection.VerticalUp, 1.0);
W_Gesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);
W_Gesture.addDirection(Finger.Ring,   FingerDirection.VerticalUp, 1.0);

// ─── X ───────────────────────────────────────────────────────────────────────
// Index finger hooked/bent, all others curled
export const X_Gesture = new GestureDescription('X');
X_Gesture.addCurl(Finger.Thumb,  FingerCurl.FullCurl,  1.0);
X_Gesture.addCurl(Finger.Index,  FingerCurl.HalfCurl,  1.0);
X_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
X_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
X_Gesture.addCurl(Finger.Pinky,  FingerCurl.FullCurl,  1.0);
X_Gesture.addDirection(Finger.Index, FingerDirection.VerticalUp,      1.0);
X_Gesture.addDirection(Finger.Index, FingerDirection.DiagonalUpRight, 0.9);

// ─── Y ───────────────────────────────────────────────────────────────────────
// Thumb and pinky extended (shaka / "hang loose")
export const Y_Gesture = new GestureDescription('Y');
Y_Gesture.addCurl(Finger.Thumb,  FingerCurl.NoCurl,    1.0);
Y_Gesture.addCurl(Finger.Index,  FingerCurl.FullCurl,  1.0);
Y_Gesture.addCurl(Finger.Middle, FingerCurl.FullCurl,  1.0);
Y_Gesture.addCurl(Finger.Ring,   FingerCurl.FullCurl,  1.0);
Y_Gesture.addCurl(Finger.Pinky,  FingerCurl.NoCurl,    1.0);
Y_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 1.0);
Y_Gesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft,  0.9);
Y_Gesture.addDirection(Finger.Pinky, FingerDirection.VerticalUp,      1.0);

// ─── Export all gestures ─────────────────────────────────────────────────────
export const ASL_GESTURES = [
  A_Gesture,
  B_Gesture,
  C_Gesture,
  D_Gesture,
  E_Gesture,
  F_Gesture,
  G_Gesture,
  H_Gesture,
  I_Gesture,
  K_Gesture,
  L_Gesture,
  M_Gesture,
  N_Gesture,
  O_Gesture,
  R_Gesture,
  S_Gesture,
  T_Gesture,
  U_Gesture,
  V_Gesture,
  W_Gesture,
  X_Gesture,
  Y_Gesture,
];

// Letters excluded: J (drawn arc), Z (drawn Z motion)
