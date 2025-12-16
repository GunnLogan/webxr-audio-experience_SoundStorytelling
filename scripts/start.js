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
  const iosVideo = document.querySelector("#iosCamera");

  if (!startBtn || !intro || !scene || !camera) return;

  let introPlayed = false;
  let debugMode = false;

  // =====================================================
  // iOS CAMERA PASSTHROUGH (FAKE AR)
  // =====================================================
  async function enableIOSCamera() {
    if (!iosVideo) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      iosVideo.srcObject = stream;
      iosVideo.style.display = "block";

      // Make A-Frame transparent
      scene.renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.warn("iOS camera failed:", e);
    }
  }

  // =====================================================
  // INTRO FINISH
  // =====================================================
  function finishIntro() {
    if (!window.__CURRENT_AUDIO_ENTITY__) return;

    try {
      intro.components.sound.stopSound();
    } catch {}

    window.__CURRENT_AUDIO_ENTITY__ = null;
    scene.systems["path-manager"]?.spawnInitialDirections();
  }

  // =====================================================
  // START EXPERIENCE
  // =====================================================
  async function startExperience() {
    // Hide overlay
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    // -----------------------------
    // DESKTOP DEBUG
    // -----------------------------
    if (debugMode) {
      debugSky?.setAttribute("visible", "true");
      camera.setAttribute("wasd-controls", "enabled:true");
      camera.setAttribute("look-controls", "enabled:true");
      camera.setAttribute("position", "0 1.6 0");
      return;
    }

    // -----------------------------
    // ANDROID AR
    // -----------------------------
    if (!window.IS_IOS && scene.enterAR) {
      try {
        await scene.enterAR();
      } catch (e) {
        console.warn("AR failed:", e);
      }
    }

    // -----------------------------
    // iOS FAKE AR
    // -----------------------------
    if (window.IS_IOS) {
      debugSky?.setAttribute("visible", "false");
      await enableIOSCamera();
    }
  }

  // =====================================================
  // START BUTTON (IMPORTANT: AUDIO MUST START HERE)
  // =====================================================
  startBtn.addEventListener("click", (e) => {
    debugMode = e.shiftKey === true;
    window.__DEBUG_MODE__ = debugMode;

    // 🔑 iOS AUDIO UNLOCK + PLAY MUST BE SYNC
    const ctx = AFRAME.audioContext;
    if (ctx?.state === "suspended") {
      ctx.resume();
    }

    if (!introPlayed) {
      introPlayed = true;
      window.__CURRENT_AUDIO_ENTITY__ = intro;
      intro.components.sound.playSound();
      intro.addEventListener("sound-ended", finishIntro, { once: true });
    }

    startExperience();
  });

  // =====================================================
  // DESKTOP — X FINISHES CURRENT AUDIO
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
});
