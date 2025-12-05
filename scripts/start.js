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

  if (!startButton || !debugButton) {
    console.error("ERROR: Start or Debug button not found");
    return;
  }

  // ============================================================
  // AUDIO UNLOCK — resumes A-Frame’s existing AudioContext only
  // ============================================================
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  // ============================================================
  // MOBILE AR ENTER (used ONLY for Start button)
  // ============================================================
  async function tryEnterARMobile() {
    if (!navigator.xr || !navigator.xr.isSessionSupported) return;

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) return;

      scene.setAttribute(
        "webxr",
        "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
      );

      await scene.enterAR();
      console.log("AR entered successfully.");
    } catch (e) {
      console.warn("AR entry failed:", e);
    }
  }

  // ============================================================
  // SAFE DESKTOP DEBUG — does NOT attempt AR
  // ============================================================
  async function debugMode() {
    console.log("Desktop debug mode activated.");
    // No AR attempt to avoid warnings
  }

  // ============================================================
  // START BUTTON — mobile AR startup
  // ============================================================
  startButton.addEventListener("click", async () => {
    await unlockAudio();

    // Fade overlay
    overlay.style.opacity = "0";
    overlay.classList.add("hidden");

    setTimeout(() => {
      overlay.style.display = "none";
      blackout.classList.add("active");
    }, 800);

    // 🟢 Enter AR on mobile only
    if (isIOS() || isAndroid()) {
      await tryEnterARMobile();
    }

    intro?.components?.sound?.playSound();
  });

  // ============================================================
  // DEBUG BUTTON — desktop testing mode
  // ============================================================
  debugButton.addEventListener("click", async () => {
    await unlockAudio();

    overlay.style.opacity = "0";
    overlay.classList.add("hidden");

    setTimeout(() => {
      overlay.style.display = "none";
    }, 800);

    await debugMode();

    intro?.components?.sound?.playSound();
  });

});
