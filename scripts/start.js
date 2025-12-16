// =====================================================
// PLATFORM FLAG — DEFINE ONCE
// =====================================================
window.IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// =====================================================
// GLOBAL AUDIO STATE
// =====================================================
window.__CURRENT_AUDIO_NODE__ = null;
window.__CURRENT_AUDIO_ENTITY__ = null;
window.__DEBUG_MODE__ = false;

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");

  if (!startBtn || !intro || !scene || !camera) return;

  let introPlayed = false;
  let debugMode = false;

  // =====================================================
  // AUDIO UNLOCK (REQUIRED FOR MOBILE)
  // =====================================================
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx?.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
  }

  // =====================================================
  // INTRO FINISH (NATURAL OR X)
  // =====================================================
  function finishIntro() {
    if (!window.__CURRENT_AUDIO_ENTITY__) return;

    try {
      intro.components.sound.stopSound();
    } catch {}

    window.__CURRENT_AUDIO_ENTITY__ = null;

    // Spawn first path nodes
    scene.systems["path-manager"]?.spawnInitialDirections();
  }

  // =====================================================
  // START EXPERIENCE
  // =====================================================
  async function startExperience() {
    // Fade out start overlay
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 600);

    // -----------------------------
    // DESKTOP DEBUG MODE
    // -----------------------------
    if (debugMode) {
      debugSky?.setAttribute("visible", "true");
      camera.setAttribute("wasd-controls", "enabled:true");
      camera.setAttribute("look-controls", "enabled:true");
      camera.setAttribute("position", "0 1.6 0");
    }

    // -----------------------------
    // ANDROID AR ONLY (NO DEBUG)
    // -----------------------------
    if (!debugMode && !window.IS_IOS && scene.enterAR) {
      try {
        await scene.enterAR();
      } catch (e) {
        console.warn("AR failed to start", e);
      }
    }

    // -----------------------------
    // INTRO AUDIO
    // -----------------------------
    if (!introPlayed) {
      introPlayed = true;
      window.__CURRENT_AUDIO_ENTITY__ = intro;

      intro.components.sound.playSound();
      intro.addEventListener("sound-ended", finishIntro, { once: true });
    }
  }

  // =====================================================
  // START BUTTON
  // =====================================================
  startBtn.addEventListener("click", async (e) => {
    debugMode = e.shiftKey === true;
    window.__DEBUG_MODE__ = debugMode;

    await unlockAudio();
    startExperience();
  });

  // =====================================================
  // DESKTOP — X FINISHES CURRENT AUDIO ONLY
  // =====================================================
  document.addEventListener(
    "keydown",
    (e) => {
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
    },
    true
  );
});
