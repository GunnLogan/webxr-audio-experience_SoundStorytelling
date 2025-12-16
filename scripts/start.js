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

  // 🌍 GLOBAL DEBUG FLAG (shared with proximity.js)
  window.__DEBUG_MODE__ = false;

  /* ===============================
     WASD CONTROL HELPER (DEBUG ONLY)
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
     AUDIO UNLOCK (MOBILE)
     =============================== */
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn("Audio unlock failed", e);
      }
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
    } catch (e) {
      console.warn("iOS camera access failed", e);
    }
  }

  /* ===============================
     DEBUG TOAST
     =============================== */
  function showDebugToast() {
    const toast = document.createElement("div");
    toast.textContent = "DEBUG MODE";

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "8px 14px",
      fontSize: "0.75rem",
      letterSpacing: "0.12em",
      background: "rgba(0,0,0,0.75)",
      color: "white",
      borderRadius: "8px",
      opacity: "0",
      transition: "opacity 0.4s ease",
      zIndex: "10001"
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 1500);
  }

  /* ===============================
     DEBUG CONTROLS
     =============================== */
  function enableDebugControls() {
    debugSky?.setAttribute("visible", "true");

    camera.setAttribute("position", "0 1.6 0");
    camera.setAttribute("look-controls", "enabled:true");

    setWASDEnabled(true);

    window.addEventListener("keydown", (e) => {
      if (!window.__DEBUG_MODE__) return;
      const pos = camera.object3D.position;
      if (e.code === "KeyQ") pos.y += 0.1;
      if (e.code === "KeyE") pos.y -= 0.1;
    });

    showDebugToast();
  }

  /* ===============================
     START EXPERIENCE
     =============================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 600);

    // ANDROID → real WebXR AR
    if (!debugMode && scene.enterAR && !isIOS) {
      try {
        await scene.enterAR();
      } catch (e) {
        console.warn("AR entry failed", e);
      }
    }

    // iOS → camera passthrough fallback
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

      // 🔒 Freeze WASD during intro (debug only)
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

  // Mobile: long-press for debug
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
