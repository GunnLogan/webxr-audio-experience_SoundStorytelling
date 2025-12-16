window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");
  const iosVideo = document.querySelector("#iosCamera");
  const mobileSkipBtn = document.querySelector("#mobileSkipButton");

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!startBtn || !overlay || !intro || !scene || !camera) return;

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  /* =====================================================
     GLOBAL SHARED STATE (SAFE SINGLETONS)
     ===================================================== */
  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO_NODE__ = null;
  window.__CURRENT_AUDIO_ENTITY__ = null;

  /* =====================================================
     DEBUG HINT (CREATE IF MISSING)
     ===================================================== */
  let debugHint = document.querySelector("#debugHint");
  if (!debugHint) {
    debugHint = document.createElement("div");
    debugHint.id = "debugHint";
    debugHint.textContent = "PRESS X TO SKIP AUDIO";
    document.body.appendChild(debugHint);
  }

  /* =====================================================
     WASD — HARD RESET (A-FRAME SAFE)
     ===================================================== */
  function setWASDEnabled(enabled) {
    if (!window.__DEBUG_MODE__) return;

    // HARD RESET REQUIRED BY A-FRAME
    camera.removeAttribute("wasd-controls");

    if (enabled) {
      camera.setAttribute("wasd-controls", {
        enabled: true,
        fly: true,
        acceleration: 35
      });
    }
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
    debugHint.classList.add("visible");
  }

  /* =====================================================
     START EXPERIENCE
     ===================================================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    // Android / Desktop WebXR
    if (!debugMode && scene.enterAR && !isIOS) {
      try { await scene.enterAR(); } catch {}
    }

    // iOS fallback
    if (!debugMode && isIOS) {
      await enableIOSCameraPassthrough();
    }

    if (debugMode) {
      enableDebugControls();
    } else {
      debugSky?.setAttribute("visible", "false");
      debugHint.classList.remove("visible");
    }

    /* -------- INTRO AUDIO -------- */
    if (!introPlayed) {
      introPlayed = true;

      setWASDEnabled(false);

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
     DESKTOP DEBUG — PRESS X TO SKIP AUDIO (FINAL)
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

      // 🔑 CRITICAL: restore WASD cleanly
      setWASDEnabled(false);
      setTimeout(() => setWASDEnabled(true), 0);
    },
    true // CAPTURE PHASE — required for A-Frame canvas
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
