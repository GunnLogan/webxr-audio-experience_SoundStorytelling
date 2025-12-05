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
  // AUDIO UNLOCK (iOS/Android requires user gesture)
  // ============================================================
  async function unlockAudio() {
    const ctx = AFRAME.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    AFRAME.audioContext = ctx;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  // ============================================================
  // MOBILE START
  // ============================================================
  startButton.addEventListener("click", async () => {
    await unlockAudio();

    // Fade overlay
    overlay.style.opacity = "0";
    overlay.classList.add("hidden");

    // After fade, hide fully & activate blackout
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

    // Try entering AR (will fail on desktop, which is fine)
    try {
      scene.setAttribute(
        "webxr",
        "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
      );
      await scene.enterAR();
    } catch (e) {
      console.warn("Desktop — AR entry expected to fail:", e);
    }

    intro?.components?.sound?.playSound();
  });
});
