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
  const ambient = document.querySelector("#ambient");
  const scene = document.querySelector("a-scene");

  if (!startButton || !debugButton) {
    console.error("ERROR: Start or Debug button not found");
    return;
  }

  // ============================================================
  // AUDIO UNLOCK (never replaces A-Frame's AudioContext)
  // ============================================================
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
    // If ctx does not exist yet, A-Frame will lazily create it
    // when the first sound is played.
  }

  // ============================================================
  // Safe AR enter for desktop debug (no more resize warnings)
  // ============================================================
  async function tryEnterAR(sceneEl) {
    try {
      if (!navigator.xr || !navigator.xr.isSessionSupported) {
        console.warn("WebXR not available; skipping AR enter.");
        return;
      }

      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        console.warn("Immersive AR not supported on this device.");
        return;
      }

      sceneEl.setAttribute(
        "webxr",
        "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
      );
      await sceneEl.enterAR();
    } catch (e) {
      console.warn("Desktop debug: AR entry not possible, continuing normally.", e);
    }
  }

  // ============================================================
  // MOBILE START BUTTON
  // ============================================================
  startButton.addEventListener("click", async () => {
    await unlockAudio();

    // Fade overlay + stop blocking touches
    overlay.style.opacity = "0";
    overlay.classList.add("hidden");

    setTimeout(() => {
      overlay.style.display = "none";
      blackout.classList.add("active");
    }, 800);

    intro?.components?.sound?.playSound();
  });

  // ============================================================
  // DESKTOP DEBUG MODE
  // ============================================================
  debugButton.addEventListener("click", async () => {
    await unlockAudio();

    overlay.style.opacity = "0";
    overlay.classList.add("hidden");

    setTimeout(() => {
      overlay.style.display = "none";
    }, 800);

    // Try AR, but only if supported – no warnings on desktop
    await tryEnterAR(scene);

    intro?.components?.sound?.playSound();
  });
});
