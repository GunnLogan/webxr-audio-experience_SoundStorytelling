window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");
  const iosVideo = document.querySelector("#iosCamera");
  const mobileSkipBtn = document.querySelector("#mobileSkipButton");
  const debugHint = document.querySelector("#debugHint");

  const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!startBtn || !overlay || !intro || !scene || !camera) return;

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  /* =====================================================
     GLOBAL SHARED STATE
     ===================================================== */
  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO_NODE__ = null;     // path-node
  window.__CURRENT_AUDIO_ENTITY__ = null;   // intro only

  /* =====================================================
     HELPERS — DEBUG UI
     ===================================================== */
  function showSkipHint() {
    if (window.__DEBUG_MODE__) {
      debugHint?.classList.add("visible");
    }
  }

  function hideSkipHint() {
    debugHint?.classList.remove("visible");
  }

  /* =====================================================
     WASD (DEBUG ONLY)
     ===================================================== */
  function setWASDEnabled(enabled) {
    if (!window.__DEBUG_MODE__) return;
    camera.setAttribute("wasd-controls", {
      enabled,
      fly: true,
      acceleration: 35
    });
  }

  /* =====================================================
     AUDIO UNLOCK (MOBILE)
     ===================================================== */
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
  }

  /* =====================================================
     iOS CAMERA PASSTHROUGH
     ===================================================== */
  async function enableIOSCameraPassthrough() {
    if (!iosVideo) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      iosVideo.srcObject = stream;
      iosVideo.style.display = "block";
      scene.renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.warn("iOS camera failed", e);
    }
  }

  /* =====================================================
     DEBUG CONTROLS
     ===================================================== */
  function enableDebugControls() {
    debugSky?.setAttribute("visible", "true");
    camera.setAttribute("look-controls", "enabled:true");
    setWASDEnabled(true);
  }

  /* =====================================================
     INTRO FINISH (single source of truth)
     ===================================================== */
  function finishIntro() {
    if (!window.__CURRENT_AUDIO_ENTITY__) return;

    try {
      intro.components.sound.stopSound();
    } catch {}

    window.__CURRENT_AUDIO_ENTITY__ = null;
    hideSkipHint();
    setWASDEnabled(true);

    // Intro completion behaves like natural end
    scene.systems["path-manager"]?.spawnInitialDirections();
  }

  /* =====================================================
     START EXPERIENCE
     ===================================================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    if (!debugMode && scene.enterAR && !IS_IOS) {
      try { await scene.enterAR(); } catch {}
    }

    if (!debugMode && IS_IOS) {
      await enableIOSCameraPassthrough();
    }

    if (debugMode) enableDebugControls();
    else debugSky?.setAttribute("visible", "false");

    if (!introPlayed) {
      introPlayed = true;
      setWASDEnabled(false);

      // Register intro as current audio
      window.__CURRENT_AUDIO_ENTITY__ = intro;
      showSkipHint();

      intro.components.sound.playSound();

      intro.addEventListener(
        "sound-ended",
        () => finishIntro(),
        { once: true }
      );
    }
  }

  /* =====================================================
     START INPUT
     ===================================================== */
  startBtn.addEventListener("click", async (e) => {
    debugMode = e.shiftKey === true;
    window.__DEBUG_MODE__ = debugMode;
    await unlockAudio();
    startExperience();
  });

  startBtn.addEventListener("touchstart", () => {
    longPressTimer = setTimeout(() => {
      debugMode = true;
      window.__DEBUG_MODE__ = true;
    }, 800);
  });

  startBtn.addEventListener("touchend", async () => {
    clearTimeout(longPressTimer);
    await unlockAudio();
    startExperience();
  });

  /* =====================================================
     DESKTOP DEBUG — PRESS X TO FINISH CURRENT AUDIO ONLY
     ===================================================== */
  document.addEventListener(
    "keydown",
    (e) => {
      if (!window.__DEBUG_MODE__) return;
      if (e.code !== "KeyX") return;

      // 1️⃣ Path-node audio
      if (window.__CURRENT_AUDIO_NODE__) {
        window.__CURRENT_AUDIO_NODE__.forceFinish();
        hideSkipHint();
        setWASDEnabled(true);
        return;
      }

      // 2️⃣ Intro audio
      if (window.__CURRENT_AUDIO_ENTITY__) {
        finishIntro();
      }
    },
    true
  );

  /* =====================================================
     MOBILE SKIP BUTTON (same behavior as X)
     ===================================================== */
  if (mobileSkipBtn) {
    mobileSkipBtn.textContent = "SKIP AUDIO";
    mobileSkipBtn.addEventListener("click", () => {
      if (window.__CURRENT_AUDIO_NODE__) {
        window.__CURRENT_AUDIO_NODE__.forceFinish();
        hideSkipHint();
        setWASDEnabled(true);
      } else if (window.__CURRENT_AUDIO_ENTITY__) {
        finishIntro();
      }
    });
  }
});
