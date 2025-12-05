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

  async function unlockAudio() {
    const ctx = AFRAME.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    AFRAME.audioContext = ctx;
    if (ctx.state === "suspended") await ctx.resume();
  }

  // ----------------------------------------------------
  // MOBILE START
  // ----------------------------------------------------
  startButton.addEventListener("click", async () => {
    await unlockAudio();

    overlay.style.transition = "opacity 0.8s ease";
    overlay.style.opacity = "0";

    // 🔥 Critical mobile fix
    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      overlay.style.display = "none";
      blackout.classList.add("active");
    }, 800);

    intro?.components?.sound?.playSound();
  });

  // ----------------------------------------------------
  // DESKTOP DEBUG
  // ----------------------------------------------------
  debugButton.addEventListener("click", async () => {
    await unlockAudio();

    overlay.style.transition = "opacity 0.8s ease";
    overlay.style.opacity = "0";

    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      overlay.style.display = "none";
    }, 800);

    try {
      scene.setAttribute(
        "webxr",
        "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
      );
      await scene.enterAR();
    } catch (e) {
      console.warn("AR entry failed (expected on desktop):", e);
    }

    intro?.components?.sound?.playSound();
  });
});
