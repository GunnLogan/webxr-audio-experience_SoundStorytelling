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
  // AUDIO UNLOCK (Important fix: never replace A-Frame's context)
  // ============================================================
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;

    // If A-Frame already created a context, resume it.
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }

    // If ctx does NOT exist yet, A-Frame will auto-create it
    // on the first playSound() call — no need to manually create one.
  }

  // ============================================================
  // MOBILE START BUTTON
  // ============================================================
  startButton.addEventListener("click", async () => {
    await unlockAudio();

    // Fade overlay
    overlay.style.opacity = "0";
    overlay.classList.add("hidden"); // Stops blocking all touches instantly

    // Remove overlay & activate blackout after fade
    setTimeout(() => {
      overlay.style.display = "none";
      blackout.classList.add("active");
    }, 800);

    // Play intro
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

    // Desktop debug: try to enter AR if possible
    try {
      scene.setAttribute(
        "webxr",
        "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
      );

      await scene.enterAR();
    } catch (e) {
      console.warn("Desktop: AR entry failed (expected):", e);
    }

    // Play intro
    intro?.components?.sound?.playSound();
  });
});
