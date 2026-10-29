
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
    
    const playNote = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.2);       
    playNote(659.25, now + 0.2, 0.2); 
    playNote(783.99, now + 0.4, 0.2); 
    playNote(1046.50, now + 0.6, 0.6); 
  } catch (e) { 
    console.log("Audio zablokowane przez przeglądarkę", e); 
  }
};