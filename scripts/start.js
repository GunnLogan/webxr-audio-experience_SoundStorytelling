window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");
  const iosVideo = document.querySelector("#iosCamera");

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!startBtn || !overlay || !intro || !scene || !camera) {
    console.error("Start.js: required elements missing");
    return;
  }

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  // 🌍 GLOBAL FLAGS (shared with proximity.js)
  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO__ = null;

  /* ===============================
     WASD (DEBUG ONLY)
     =============================== */
  function setWASDEnabled(enabled) {
    if (!window.__DEBUG_MODE__) return;
    camera.setAttribute("wasd-controls", {
      enabled,
      fly: true,
      acceleration: 35
    });
  }

  /* ===============================
     AUDIO UNLOCK
     =============================== */
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
  }

  /* ===============================
     iOS CAMERA PASSTHROUGH
     =============================== */
  async function enableIOSCameraPassthrough() {
    if (!iosVideo) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      iosVideo.srcObject = stream;
      iosVideo.style.display = "block";
      scene.renderer.domElement.style.background = "transparent";
    } catch (e) {
      console.warn("iOS camera access failed", e);
    }
  }

  /* ===============================
     DEBUG HUD (SKIP HINT)
     =============================== */
  function showDebugHint() {
    const hint = document.createElement("div");
    hint.textContent = "DEBUG: Press X to skip audio";
    Object.assign(hint.style, {
      position: "fixed",
      bottom: "16px",
      right: "16px",
      padding: "6px 10px",
      fontSize: "0.7rem",
      letterSpacing: "0.08em",
      background: "rgba(0,0,0,0.6)",
      color: "#fff",
      borderRadius: "6px",
      zIndex: "10001",
      pointerEvents: "none"
    });
    document.body.appendChild(hint);
  }

  /* ===============================
     DEBUG CONTROLS
     =============================== */
  function enableDebugControls() {
    debugSky?.setAttribute("visible", "true");
    camera.setAttribute("position", "0 1.6 0");
    camera.setAttribute("look-controls", "enabled:true");
    setWASDEnabled(true);
    showDebugHint();
  }

  /* ===============================
     SKIP AUDIO (DEBUG ONLY)
     =============================== */
  window.addEventListener("keydown", (e) => {
  if (!window.__DEBUG_MODE__) return;

  // X key skips current audio
  if (e.code === "KeyX") {
    const playingSounds = document.querySelectorAll("[sound]");
    playingSounds.forEach(el => {
      const sound = el.components?.sound;
      if (sound && sound.isPlaying) {
        sound.stopSound();
      }
    });
  }
});


  /* ===============================
     START EXPERIENCE
     =============================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    // ANDROID → WebXR AR
    if (!debugMode && scene.enterAR && !isIOS) {
      try { await scene.enterAR(); } catch {}
    }

    // iOS → camera passthrough
    if (!debugMode && isIOS) {
      await enableIOSCameraPassthrough();
    }

    if (debugMode) {
      enableDebugControls();
    } else {
      debugSky?.setAttribute("visible", "false");
    }

    if (!introPlayed) {
      introPlayed = true;
      setWASDEnabled(false);

      window.__CURRENT_AUDIO__ = intro;
      intro.components.sound.playSound();

      intro.addEventListener("sound-ended", () => {
        window.__CURRENT_AUDIO__ = null;
        setWASDEnabled(true);
        scene.systems["path-manager"]?.spawnInitialDirections();
      }, { once: true });
    }
  }

  /* ===============================
     INPUT
     =============================== */
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
});
