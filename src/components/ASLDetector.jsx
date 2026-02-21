/**
 * ASLDetector — Drop-in component for the camera → translation pipeline
 *
 * This component is intentionally unstyled beyond basics.
 * The frontend team should wrap/restyle it.
 *
 * What it exposes via onTranslation callback:
 *   { currentLetter, currentWord, sentence }
 *
 * How to use:
 *   <ASLDetector onTranslation={({ sentence }) => setMyState(sentence)} />
 */

import { useEffect } from 'react';
import { useASLDetection } from '../hooks/useASLDetection';

export default function ASLDetector({ onTranslation }) {
  const {
    videoRef,
    canvasRef,
    currentLetter,
    currentWord,
    sentence,
    isLoading,
    handVisible,
    clearSentence,
    clearWord,
    addSpace,
  } = useASLDetection();

  // Notify parent whenever translation state changes
  useEffect(() => {
    onTranslation?.({ currentLetter, currentWord, sentence });
  }, [currentLetter, currentWord, sentence, onTranslation]);

  return (
    <div style={styles.wrapper}>

      {/* ── Camera + Skeleton Overlay ─────────────────────────────────────── */}
      <div style={styles.cameraContainer}>
        {/* Hidden video element — MediaPipe reads from this */}
        <video
          ref={videoRef}
          style={styles.video}
          autoPlay
          muted
          playsInline
        />
        {/* Canvas draws the hand skeleton on top of the video */}
        <canvas
          ref={canvasRef}
          style={styles.canvas}
        />

        {/* Status badges */}
        {isLoading && (
          <div style={styles.badge}>Loading model...</div>
        )}
        {!isLoading && !handVisible && (
          <div style={styles.badge}>Show your hand</div>
        )}
        {!isLoading && handVisible && currentLetter && (
          <div style={{ ...styles.badge, background: '#00FF88', color: '#000' }}>
            Detecting: {currentLetter}
          </div>
        )}
      </div>

      {/* ── Live Translation Output ───────────────────────────────────────── */}
      <div style={styles.outputPanel}>

        {/* Current letter being held */}
        <div style={styles.currentLetter}>
          {currentLetter || '–'}
        </div>

        {/* Word being built */}
        <div style={styles.wordRow}>
          <span style={styles.label}>Building:</span>
          <span style={styles.wordDisplay}>{currentWord || '...'}</span>
        </div>

        {/* Full sentence so far */}
        <div style={styles.sentenceRow}>
          <span style={styles.label}>Sentence:</span>
          <span style={styles.sentenceDisplay}>{sentence || '...'}</span>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <button onClick={addSpace}      style={styles.btn}>Space (commit word)</button>
          <button onClick={clearWord}     style={styles.btn}>Clear word</button>
          <button onClick={clearSentence} style={{ ...styles.btn, background: '#FF3366' }}>
            Clear all
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Minimal inline styles (frontend team replaces these) ────────────────────

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    fontFamily: 'monospace',
  },
  cameraContainer: {
    position: 'relative',
    width: '640px',
    height: '480px',
    background: '#111',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  video: {
    // Hidden — canvas covers it with the mirrored + annotated version
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    pointerEvents: 'none',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  outputPanel: {
    width: '640px',
    background: '#1a1a1a',
    borderRadius: '8px',
    padding: '16px',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  currentLetter: {
    fontSize: '96px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00FF88',
    lineHeight: 1,
  },
  wordRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  sentenceRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  label: {
    color: '#888',
    minWidth: '80px',
    fontSize: '13px',
  },
  wordDisplay: {
    fontSize: '28px',
    letterSpacing: '4px',
    color: '#FFD700',
  },
  sentenceDisplay: {
    fontSize: '18px',
    color: '#fff',
    lineHeight: 1.5,
  },
  controls: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  btn: {
    padding: '8px 14px',
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};
