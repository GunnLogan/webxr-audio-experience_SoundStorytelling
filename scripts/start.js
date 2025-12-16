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

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!startBtn || !overlay || !intro || !scene || !camera) return;

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  /* =====================================================
     GLOBAL SHARED STATE
     ===================================================== */
  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO_NODE__ = null;
  window.__CURRENT_AUDIO_ENTITY__ = null;

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
     AUDIO UNLOCK (MOBILE SAFETY)
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

      // Transparent A-Frame canvas
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
    debugHint?.classList.add("visible");
  }

  /* =====================================================
     START EXPERIENCE
     ===================================================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    if (!debugMode && scene.enterAR && !isIOS) {
      try { await scene.enterAR(); } catch {}
    }

    if (!debugMode && isIOS) {
      await enableIOSCameraPassthrough();
    }

    if (debugMode) enableDebugControls();
    else debugSky?.setAttribute("visible", "false");

    if (!introPlayed) {
      introPlayed = true;
      setWASDEnabled(false);

      // 🔑 Must be inside user gesture for iOS
      window.__CURRENT_AUDIO_ENTITY__ = intro;
      intro.components.sound.playSound();

      intro.addEventListener("sound-ended", () => {
        window.__CURRENT_AUDIO_ENTITY__ = null;
        setWASDEnabled(true);
        scene.systems["path-manager"]?.spawnInitialDirections();
      }, { once: true });
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
     DESKTOP DEBUG — PRESS X TO SKIP AUDIO (FIXED)
     ===================================================== */
  document.addEventListener(
    "keydown",
    (e) => {
      if (!window.__DEBUG_MODE__) return;
      if (e.code !== "KeyX") return;

      console.log("⏭️ Skip audio (X)");

      // Path-node audio
      if (window.__CURRENT_AUDIO_NODE__) {
        window.__CURRENT_AUDIO_NODE__.forceFinish();
        window.__CURRENT_AUDIO_NODE__ = null;
      }

      // Intro audio
      if (window.__CURRENT_AUDIO_ENTITY__?.components?.sound) {
        window.__CURRENT_AUDIO_ENTITY__.components.sound.stopSound();
        window.__CURRENT_AUDIO_ENTITY__ = null;
        scene.systems["path-manager"]?.spawnInitialDirections();
      }

      // ✅ HARD RE-ENABLE WASD (critical fix)
      camera.setAttribute("wasd-controls", {
        enabled: true,
        fly: true,
        acceleration: 35
      });
    },
    true // capture phase — required for A-Frame canvas
  );

  /* =====================================================
     MOBILE SKIP BUTTON
     ===================================================== */
  if (mobileSkipBtn) {
    mobileSkipBtn.textContent = "SKIP AUDIO";
    mobileSkipBtn.addEventListener("click", () => {
      if (window.__CURRENT_AUDIO_NODE__) {
        window.__CURRENT_AUDIO_NODE__.forceFinish();
      }
    });
  }
});
