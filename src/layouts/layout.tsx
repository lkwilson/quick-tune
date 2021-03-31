import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import { MusicAudioContextProvider } from '../contexts/audio_context';

export default function Layout({ children }) {
  return <MusicAudioContextProvider>{children}</MusicAudioContextProvider>;
}
