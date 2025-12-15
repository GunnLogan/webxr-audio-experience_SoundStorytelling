window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");

  if (!startBtn || !overlay || !intro || !scene || !camera) {
    console.error("Start.js: required elements missing");
    return;
  }

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  // --------------------------------------------------
  // AUDIO UNLOCK (required on mobile)
  // --------------------------------------------------
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

  // --------------------------------------------------
  // DEBUG TOAST
  // --------------------------------------------------
  function showDebugToast() {
    const toast = document.createElement("div");
    toast.textContent = "DEBUG MODE";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "8px 14px";
    toast.style.fontSize = "0.75rem";
    toast.style.letterSpacing = "0.12em";
    toast.style.background = "rgba(0,0,0,0.75)";
    toast.style.color = "white";
    toast.style.borderRadius = "8px";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s ease";
    toast.style.zIndex = "10001";

    document.body.appendChild(toast);

    requestAnimationFrame(() => (toast.style.opacity = "1"));

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 1500);
  }

  // --------------------------------------------------
  // ENABLE DESKTOP DEBUG CONTROLS
  // --------------------------------------------------
  function enableDebugControls() {
    // Enable grey sky in desktop debug
    if (debugSky) {
      debugSky.setAttribute("visible", "true");
    }

    camera.setAttribute("position", "0 1.6 0");
    camera.setAttribute("look-controls", "enabled:true");
    camera.setAttribute("wasd-controls", {
      enabled: true,
      fly: true,
      acceleration: 35
    });

    // Q / E vertical movement
    window.addEventListener("keydown", (e) => {
      if (!debugMode) return;
      const pos = camera.object3D.position;
      if (e.code === "KeyQ") pos.y += 0.1;
      if (e.code === "KeyE") pos.y -= 0.1;
    });

    showDebugToast();
  }

  // --------------------------------------------------
  // START EXPERIENCE
  // --------------------------------------------------
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      overlay.style.display = "none";
    }, 600);

    // --- ENTER AR ON MOBILE ---
    if (!debugMode && scene.enterAR) {
      try {
        await scene.enterAR();
      } catch (e) {
        console.warn("AR entry failed", e);
      }
    }

    // --- CONTROLS ---
    if (debugMode) {
      enableDebugControls();
    } else {
      // Ensure sky is hidden in AR / normal mode
      if (debugSky) {
        debugSky.setAttribute("visible", "false");
      }

      camera.setAttribute("wasd-controls", "enabled:false");
      camera.setAttribute("look-controls", "enabled:true");
    }

    // --- INTRO AUDIO ---
    if (!introPlayed) {
      introPlayed = true;
      intro.components.sound.playSound();

      intro.addEventListener(
        "sound-ended",
        () => {
          const pm = scene.systems["path-manager"];
          if (pm) {
            pm.spawnInitialDirections();
          } else {
            console.error("PathManager not found");
          }
        },
        { once: true }
      );
    }
  }

  // --------------------------------------------------
  // DESKTOP: SHIFT + CLICK
  // --------------------------------------------------
  startBtn.addEventListener("click", async (e) => {
    debugMode = e.shiftKey === true;
    await unlockAudio();
    startExperience();
  });

  // --------------------------------------------------
  // MOBILE: LONG PRESS (800ms)
  // --------------------------------------------------
  startBtn.addEventListener("touchstart", () => {
    longPressTimer = setTimeout(() => {
      debugMode = true;
    }, 800);
  });

  startBtn.addEventListener("touchend", async () => {
    clearTimeout(longPressTimer);
    await unlockAudio();
    startExperience();
  });
});
