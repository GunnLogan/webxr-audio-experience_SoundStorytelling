// PLATFORM FLAG
window.IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// GLOBAL STATE
window.__CURRENT_AUDIO_NODE__ = null;
window.__CURRENT_AUDIO_ENTITY__ = null;

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");

  if (!startBtn || !intro || !scene) return;

  let introPlayed = false;

  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
  }

  function finishIntro() {
    if (!window.__CURRENT_AUDIO_ENTITY__) return;

    try { intro.components.sound.stopSound(); } catch {}

    window.__CURRENT_AUDIO_ENTITY__ = null;

    // IMPORTANT: only spawn nodes — no triggers here
    scene.systems["path-manager"]?.spawnInitialDirections();
  }

  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => overlay.style.display = "none", 600);

    if (!window.IS_IOS && scene.enterAR) {
      try { await scene.enterAR(); } catch {}
    }

    if (!introPlayed) {
      introPlayed = true;
      window.__CURRENT_AUDIO_ENTITY__ = intro;

      intro.components.sound.playSound();
      intro.addEventListener("sound-ended", finishIntro, { once: true });
    }
  }

  startBtn.addEventListener("click", async () => {
    await unlockAudio();
    startExperience();
  });

  // DESKTOP: X = finish current audio ONLY
  document.addEventListener("keydown", (e) => {
    if (e.code !== "KeyX") return;

    // Finish node audio
    if (window.__CURRENT_AUDIO_NODE__) {
      window.__CURRENT_AUDIO_NODE__.finish();
      return;
    }

    // Finish intro audio
    if (window.__CURRENT_AUDIO_ENTITY__) {
      finishIntro();
    }
  }, true);
});
