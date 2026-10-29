
export const playClickSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1); 
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) { 
    console.log("Audio zablokowane przez przeglądarkę", e); 
  }
};

export const playWinSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playBrassChord = (notes, startTime, duration, volume) => {
      notes.forEach((frequency) => {
        [-8, 0, 8].forEach((detune, voiceIndex) => {
          [frequency, frequency * 2].forEach((noteFrequency, harmonicIndex) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const noteVolume = volume / (notes.length * 3 * (harmonicIndex + 1));

            osc.type = voiceIndex === 1 ? 'triangle' : 'sawtooth';
            osc.detune.setValueAtTime(detune, startTime);
            osc.frequency.setValueAtTime(noteFrequency * 0.98, startTime);
            osc.frequency.linearRampToValueAtTime(noteFrequency, startTime + 0.06);
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(noteVolume, startTime + 0.035);
            gain.gain.setValueAtTime(noteVolume, startTime + duration * 0.65);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);
          });
        });
      });
    };

    const now = audioCtx.currentTime;
    const notes = [
      { note: 659.25, start: 0, dur: 0.12 },
      { note: 880.00, start: 0.10, dur: 0.35 }
    ];

    notes.forEach(({ note, start, dur }, index) => {
      playBrassChord([note], now + start, dur, index === notes.length - 1 ? 0.3 : 0.2);
    });
  } catch (e) { 
    console.log("Audio zablokowane przez przeglądarkę", e); 
  }
};