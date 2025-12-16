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

  // 🌍 Global debug + audio state
  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO_NODE__ = null;

  /* ===============================
     DEBUG HINT
     =============================== */
  function ensureDebugHint() {
    let hint = document.querySelector("#debugHint");
    if (!hint) {
      hint = document.createElement("div");
      hint.id = "debugHint";
      hint.textContent = "Press X to skip audio";
      document.body.appendChild(hint);
    }
    return hint;
  }

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

      // Make A-Frame canvas transparent
      scene.renderer.domElement.style.background = "transparent";
    } catch (e) {
      console.warn("iOS camera access failed", e);
    }
  }

  /* ===============================
     DEBUG CONTROLS
     =============================== */
  function enableDebugControls() {
    debugSky?.setAttribute("visible", "true");

    camera.setAttribute("position", "0 1.6 0");
    camera.setAttribute("look-controls", "enabled:true");

    setWASDEnabled(true);

    // Show debug hint
    const hint = ensureDebugHint();
    requestAnimationFrame(() => hint.classList.add("visible"));

    // Q / E vertical movement
    window.addEventListener("keydown", (e) => {
      if (!window.__DEBUG_MODE__) return;
      const pos = camera.object3D.position;
      if (e.code === "KeyQ") pos.y += 0.1;
      if (e.code === "KeyE") pos.y -= 0.1;
    });
  }

  /* ===============================
     START EXPERIENCE
     =============================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    // Android → WebXR AR
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

      intro.components.sound.playSound();
      intro.addEventListener(
        "sound-ended",
        () => {
          setWASDEnabled(true);
          scene.systems["path-manager"]?.spawnInitialDirections();
        },
        { once: true }
      );
    }
  }

  /* ===============================
     INPUT
     =============================== */

  // Desktop: click (Shift = debug)
  startBtn.addEventListener("click", async (e) => {
    debugMode = e.shiftKey === true;
    window.__DEBUG_MODE__ = debugMode;
    await unlockAudio();
    startExperience();
  });

  // Mobile: long press = debug
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

  /* ===============================
     DEBUG: X KEY SKIP AUDIO
     =============================== */
  window.addEventListener("keydown", (e) => {
    if (!window.__DEBUG_MODE__) return;
    if (e.code !== "KeyX") return;

    const node = window.__CURRENT_AUDIO_NODE__;
    if (!node) return;

    console.log("⏭️ Debug skip audio");

    try {
      if (node.sound?.components?.sound) {
        node.sound.components.sound.stopSound();
      }
    } catch {}

    setWASDEnabled(true);
    node.finish?.();
  });
});
