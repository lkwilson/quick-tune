import React, { useState, useContext, useRef, useEffect, useMemo, DOMElement } from 'react';
import { MusicAudioContext } from '../contexts/audio_context';

const time_constant = 0.2;
const long_notes = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
const small_notes = ['A', '#', 'B', 'C', '#', 'D', '#', 'E', 'F', '#', 'G', '#'];

function get_name(index: number, notes: string[]) {
  const octave = Math.floor(index / 12);
  const note = index % 12;
  const name = `${notes[note]}${octave}`;
  return name;
}

function setup_note(audio_context: AudioContext, frequency: number, gain: number) {
  const gain_node = audio_context.createGain();
  gain_node.gain.value = 0;
  const oscillator_node = audio_context.createOscillator();
  oscillator_node.type = 'sine';
  oscillator_node.frequency.value = frequency;
  oscillator_node.connect(gain_node).connect(audio_context.destination);
  oscillator_node.start();
  gain_node.gain.setTargetAtTime(gain, audio_context.currentTime, time_constant);
  return {
    oscillator_node,
    gain_node,
  };
}

export default function NotesComponent() {
  const { A4, frequencies, audio_context, create_audio_context } = useContext(MusicAudioContext);
  const [playing, set_playing] = useState(frequencies.map(() => false));
  const [gain, set_gain] = useState(0.2);
  const [last_gain, set_last_gain] = useState(gain);
  const long_names = useMemo(
    () => frequencies.map((value, index) => get_name(index, long_notes)),
    []
  );
  const small_names = useMemo(
    () => frequencies.map((value, index) => get_name(index, small_notes)),
    []
  );
  const audio_nodes = useRef<{ oscillator_node: OscillatorNode; gain_node: GainNode }[]>(
    frequencies.map(() => null)
  );

  useEffect(() => {
    if (audio_context === null) {
      return;
    }

    playing.forEach((playing, index) => {
      const should_play = playing && audio_nodes.current[index] === null;
      const should_pause = !playing && audio_nodes.current[index] !== null;
      if (should_play) {
        audio_nodes.current[index] = setup_note(audio_context, frequencies[index], gain);
      } else if (should_pause) {
        audio_nodes.current[index].gain_node.gain.setTargetAtTime(
          0,
          audio_context.currentTime,
          time_constant
        );
        audio_nodes.current[index].oscillator_node.stop(
          audio_context.currentTime + 5 * time_constant
        );
        audio_nodes.current[index] = null;
      }
    });
  }, [audio_context, playing]);

  useEffect(() => {
    audio_nodes.current
      .filter((node) => node !== null)
      .forEach(({ gain_node }) => {
        gain_node.gain.setTargetAtTime(gain, audio_context.currentTime, time_constant);
      });
  }, [gain]);

  // Stop all on unmount
  useEffect(() => {
    return () => {
      if (audio_context === null) {
        return;
      }

      audio_nodes.current
        .filter((node) => node !== null)
        .forEach((node, index) => {
          node.gain_node.gain.setTargetAtTime(0, audio_context.currentTime, time_constant);
          node.oscillator_node.stop(audio_context.currentTime + 5 * time_constant);
        });
      //audio_context.close();
    };
  }, []);

  function toggle(index: number) {
    // We have to create the context within the callback synchronously
    create_audio_context();
    set_playing((old_playing) => {
      old_playing[index] = !old_playing[index];
      return [...old_playing];
    });
  }

  function pause_all() {
    set_playing(playing.map(() => false));
  }

  function mute() {
    if (gain === 0) {
      set_gain(last_gain);
    } else {
      set_last_gain(gain);
      set_gain(0);
    }
  }

  function remap_index(index: number) {
    const total_index = index * 12;
    const rollover = Math.floor(total_index / frequencies.length);
    const new_index = (total_index + rollover) % frequencies.length;
    return new_index;
  }

  const freq_els = frequencies.map((_, curr_index) => {
    const index = curr_index; //remap_index(curr_index);
    const freq = frequencies[index];
    const fixed_freq = freq.toFixed(0);
    return (
      <div key={`${long_names[index]}`} className="col-1 p-0 p-sm-1 text-center">
        <div onClick={() => toggle(index)} className="border">
          <div className="fw-bold">{playing[index] ? '||' : '|>'}</div>
          <div className="fw-bold d-none d-lg-block">{long_names[index]}</div>
          <div className="fw-bold d-block d-lg-none">{small_names[index]}</div>
          <div className="fw-light d-none d-lg-block">~{fixed_freq} Hz</div>
        </div>
      </div>
    );
  });

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="mt-3 h1 text-center">Keys</div>
      <div className="d-flex">
        <div className="btn btn-primary mx-1" onClick={pause_all}>
          Pause All
        </div>
        <div className="btn btn-primary mx-1" onClick={mute}>
          Mute
        </div>
      </div>
      <div className="m-1 align-self-stretch d-flex flex-column">
        <label htmlFor="gain" className="d-flex flex-column">
          <input
            type="range"
            onInput={(event) => set_gain(parseFloat((event.target as HTMLInputElement).value))}
            className="align-self-stretch"
            name="gain"
            id="gain"
            value={gain}
            min="0"
            max="2"
            step="0.001"
          />
        </label>
        <div className="d-flex justify-content-center align-items-center my-1">
          <div
            className="border m-1 p-1"
            onClick={() => set_gain((current_gain) => current_gain - 0.001)}
          >
            {'-0.001'}
          </div>
          <div
            className="border m-1 p-1 d-none d-sm-block"
            onClick={() => set_gain((current_gain) => current_gain - 0.01)}
          >
            {'-0.01'}
          </div>
          <div
            className="border m-1 p-1 d-none d-sm-block"
            onClick={() => set_gain((current_gain) => current_gain - 0.1)}
          >
            {'-0.1'}
          </div>
          <div className="border m-1 p-1">Gain: {gain.toFixed(3)}</div>
          <div
            className="border m-1 p-1 d-none d-sm-block"
            onClick={() => set_gain((current_gain) => current_gain + 0.1)}
          >
            {'+0.1'}
          </div>
          <div
            className="border m-1 p-1 d-none d-sm-block"
            onClick={() => set_gain((current_gain) => current_gain + 0.01)}
          >
            {'+0.01'}
          </div>
          <div
            className="border m-1 p-1"
            onClick={() => set_gain((current_gain) => current_gain + 0.001)}
          >
            {'+0.001'}
          </div>
        </div>
      </div>
      <div className="row g-0">{freq_els}</div>
    </div>
  );
}
