/**
 * App.jsx — Temporary test harness
 *
 * The frontend team will replace this file with their layout.
 * ASLDetector is the component they need to drop in.
 */

import { useState } from 'react';
import ASLDetector from './components/ASLDetector';

export default function App() {
  const [translation, setTranslation] = useState({});

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
      <div>
        <h1 style={{ color: '#fff', fontFamily: 'monospace', textAlign: 'center', marginBottom: '24px' }}>
          ASL → Text (test)
        </h1>

        {/*
          ┌─────────────────────────────────────────────────────────────────┐
          │  Drop this component wherever the frontend layout needs it.     │
          │  Pass onTranslation to receive live updates.                    │
          └─────────────────────────────────────────────────────────────────┘
        */}
        <ASLDetector onTranslation={setTranslation} />

        {/* Debug panel — remove in production */}
        <pre style={{ color: '#555', fontFamily: 'monospace', fontSize: '12px', marginTop: '16px' }}>
          {JSON.stringify(translation, null, 2)}
        </pre>
      </div>
    </div>
  );
}
