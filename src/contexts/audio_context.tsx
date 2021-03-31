import React, { createContext, useContext, useMemo, useState } from 'react';

interface MusicAudioContextType {
  audio_context: AudioContext;
  A4: number;
  set_A4: React.Dispatch<React.SetStateAction<number>>;
  set_enabled: React.Dispatch<React.SetStateAction<boolean>>;
  frequencies: number[];
}

export const MusicAudioContext = createContext<MusicAudioContextType>(null);

export function MusicAudioContextProvider({ children }) {
  const [enabled, set_enabled] = useState(false);

  const audio_context = useMemo(() => {
    if (enabled) {
      return new (window.AudioContext || window.webkitAudioContext)();
    } else {
      return null;
    }
  }, [enabled]);

  const [A4, set_A4] = useState(440.0);
  const frequencies = useMemo(() => {
    // A4 is at index 0 + 12 * 4
    const A4_index = 0 + 12 * 4;
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
        set_enabled,
        A4,
        set_A4,
        frequencies,
      }}
    >
      {children}
    </MusicAudioContext.Provider>
  );
}
