function crossfade(intro, amb, fadeTime = 2000) {
  let start = null;
  let lastP = -1;

  function step(timestamp) {
    if (!start) start = timestamp;
    let p = (timestamp - start) / fadeTime;
    if (p > 1) p = 1;

    if (Math.abs(p - lastP) > 0.01) {
      if (intro.components?.sound) intro.components.sound.setVolume(1 - p);
      if (amb.components?.sound) amb.components.sound.setVolume(p);
      lastP = p;
    }

    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      if (intro.components?.sound?.isPlaying) {
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

  if (!ambient.components.sound.isPlaying) {
    ambient.components.sound.playSound();
  }

  setTimeout(() => {
    crossfade(intro, ambient);
  }, 50);
}
