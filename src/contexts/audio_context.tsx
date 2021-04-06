import React, { createContext, useContext, useMemo, useState } from 'react';

interface MusicAudioContextType {
  audio_context: AudioContext;
  A4: number;
  set_A4: React.Dispatch<React.SetStateAction<number>>;
  create_audio_context: () => void;
  frequencies: number[];
}

function build_audio_context() {
  const new_audio_context = new (window.AudioContext || window.webkitAudioContext)();
  if (new_audio_context.state === 'suspended') {
    //console.warn('New audio context was suspended. Resuming');
    new_audio_context.resume();
  }
  if (new_audio_context.state === 'suspended') {
    console.error('New audio context is still suspended. No audio will play.');
    new_audio_context.resume();
  }
  return new_audio_context;
}

export const MusicAudioContext = createContext<MusicAudioContextType>(null);

export function MusicAudioContextProvider({ children }) {
  const [audio_context, set_audio_context] = useState<AudioContext>(null);

  // Synchronous and idempotent
  function create_audio_context() {
    if (audio_context === null) {
      set_audio_context(build_audio_context());
    }
  }

  const [A4, set_A4] = useState(440.0);
  const frequencies = useMemo(() => {
    // C4 is at index 0 + 12 * 4, A4 is a major sixth (+9) above
    const A4_index = 9 + 12 * 4;
    const frequencies = [];
    for (let i = 0; i < 12 * 9; ++i) {
      frequencies.push(A4 * Math.pow(2, (i - A4_index) / 12));
    }
    return frequencies;
  }, [A4]);

  return (
    <MusicAudioContext.Provider
      value={{
        audio_context,
        create_audio_context,
        A4,
        set_A4,
        frequencies,
      }}
    >
      {children}
    </MusicAudioContext.Provider>
  );
}
