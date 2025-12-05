// Smooth crossfade between intro and ambient
function crossfade(intro, amb, fadeTime = 2000) {
  let start = null;
  let lastP = -1;

  function step(timestamp) {
    if (!start) start = timestamp;
    let p = (timestamp - start) / fadeTime;
    if (p > 1) p = 1;

    // Only update if value changed enough (prevents spam warnings)
    if (Math.abs(p - lastP) > 0.01) {
      intro.components.sound.setVolume(1 - p);
      amb.components.sound.setVolume(p);
      lastP = p;
    }

    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      // Fully finished: stop intro cleanly
      if (intro.components.sound.isPlaying) {
        intro.components.sound.stopSound();
      }
    }
  }

  requestAnimationFrame(step);
}

function handleIntroEnded(intro, ambient) {
  // Show A spheres
  document.querySelectorAll("a-sphere[id^='a']").forEach((a) =>
    a.setAttribute("visible", "true")
  );

  // Ensure ambient is started BEFORE fading
  if (!ambient.components.sound.isPlaying) {
    ambient.components.sound.playSound();
  }

  // Delay fade slightly to avoid mobile WebAudio timing issues
  setTimeout(() => {
    crossfade(intro, ambient);
  }, 50);
}
