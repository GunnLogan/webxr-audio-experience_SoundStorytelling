function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

window.addEventListener("DOMContentLoaded", () => {
  if (window._startBound) return;
  window._startBound = true;

  const startButton = document.querySelector("#startButton");
  const debugButton = document.querySelector("#debugButton");
  const overlay = document.querySelector("#startOverlay");
  const blackout = document.querySelector("#blackoutScreen");

  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const cam = document.querySelector("#camera");

  if (!startButton || !debugButton) {
    console.error("ERROR: Start or Debug button not found");
    return;
  }

  // Global flag: nothing should auto-play before this is true
  window._experienceStarted = false;

  // ============================================================
  // AUDIO UNLOCK — resume A-Frame AudioContext only
  // ============================================================
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
        console.log("AudioContext resumed:", ctx.state);
      } catch (e) {
        console.warn("AudioContext resume failed:", e);
      }
    }
  }

  // ============================================================
  // MOBILE AR ENTRY (hit-test optional)
  // ============================================================
  async function tryEnterARMobile() {
    if (!navigator.xr || !navigator.xr.isSessionSupported) {
      console.warn("No WebXR API — cannot enter AR");
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      console.log("AR supported:", supported);

      if (!supported) return;

      scene.setAttribute(
        "webxr",
        "optionalFeatures: local-floor, hit-test;"
      );

      await scene.enterAR();
      console.log("Entered AR successfully");

      blackout.style.display = "none";
      overlay.style.display = "none";

    } catch (e) {
      console.warn("AR entry failed:", e);
    }
  }

  // ============================================================
  // DESKTOP DEBUG MODE — no AR, WASD enabled
  // ============================================================
  function activateDesktopMode() {
    console.log("Desktop debug mode");

    cam.setAttribute("position", "0 1.6 0");
    cam.setAttribute("wasd-controls", "enabled:true");
    cam.setAttribute("look-controls", "enabled:true");
  }

  // ============================================================
  // START BUTTON — MOBILE AR MODE
  // ============================================================
  startButton.addEventListener("click", async () => {
    // Mark experience as started (ambient-proximity will see this)
    window._experienceStarted = true;

    // First unlock audio after user gesture
    await unlockAudio();

    overlay.style.opacity = "0";
    overlay.classList.add("hidden");

    setTimeout(() => {
      overlay.style.display = "none";
      blackout.style.display = "none";
    }, 800);

    cam.removeAttribute("position");
    cam.setAttribute("wasd-controls", "enabled:false");
    cam.setAttribute("look-controls", "enabled:true");

    if (isAndroid() || isIOS()) {
      await tryEnterARMobile();
    }

    // Second unlock just in case AR permission flow suspended audio again
    await unlockAudio();

    intro?.components?.sound?.playSound();
  });

  // ============================================================
  // DEBUG BUTTON — DESKTOP MODE
  // ============================================================
  debugButton.addEventListener("click", async () => {
    window._experienceStarted = true;

    await unlockAudio();

    overlay.style.opacity = "0";
    overlay.classList.add("hidden");
    setTimeout(() => overlay.style.display = "none", 800);

    activateDesktopMode();

    intro?.components?.sound?.playSound();
  });

});
