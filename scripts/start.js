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
  // AUDIO UNLOCK (CRITICAL)
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
  // INTRO FINISH (SAFE + IDEMPOTENT)
  // =====================================================
  function finishIntro() {
    if (!window.__CURRENT_AUDIO_ENTITY__) return;

    try {
      intro.components.sound.stopSound();
    } catch {}

    intro.removeEventListener("sound-ended", finishIntro);

    window.__CURRENT_AUDIO_ENTITY__ = null;

    scene.systems["path-manager"]?.spawnInitialDirections();
  }

  // =====================================================
  // START EXPERIENCE
  // =====================================================
  async function startExperience() {
    // Hide overlay BEFORE XR
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

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
    // ANDROID AR ONLY
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

      await unlockAudio(); // 🔑 REQUIRED

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

      if (window.__CURRENT_AUDIO_NODE__) {
        window.__CURRENT_AUDIO_NODE__.finish();
        return;
      }

      if (window.__CURRENT_AUDIO_ENTITY__) {
        finishIntro();
      }
    },
    true
  );

  // =====================================================
  // INFO POSTER — ONE TIME REVEAL
  // =====================================================
  const infoButton = document.querySelector("#infoButton");
  const posterOverlay = document.querySelector("#posterOverlay");

  if (infoButton && posterOverlay) {
    infoButton.addEventListener("click", () => {
      posterOverlay.classList.add("visible");
      infoButton.classList.add("disabled");

      setTimeout(() => {
        posterOverlay.classList.remove("visible");
      }, 5000);
    });
  }
});
