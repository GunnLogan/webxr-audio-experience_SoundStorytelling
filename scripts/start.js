function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

window.onload = () => {

  // Prevent duplicate bindings
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
  // 🎯 AUDIO UNLOCK HELPER
  // ============================================================
  async function unlockAudio() {
    if (AFRAME.audioContext?.state === "suspended") {
      await AFRAME.audioContext.resume();
    }
  }

  // ============================================================
  // 🎉 MOBILE START (iOS + Android)
  // → Fade overlay → permanent blackout → play intro
  // ============================================================
  startButton.addEventListener("click", async () => {

    await unlockAudio();

    // Fade overlay to black
    overlay.style.transition = "opacity 0.8s ease";
    overlay.style.opacity = "0";

    // Remove overlay after fade + activate blackout
    setTimeout(() => {
      overlay.style.display = "none";
      blackout.classList.add("active");  // stays forever
    }, 800);

    // Play intro once
    if (intro?.components?.sound) {
      intro.components.sound.playSound();
    }
  });

  // ============================================================
  // 🎉 DESKTOP DEBUG MODE
  // → Fade overlay → reveal scene → start normal mode
  // ============================================================
  debugButton.addEventListener("click", async () => {

    await unlockAudio();

    // Fade overlay to black
    overlay.style.transition = "opacity 0.8s ease";
    overlay.style.opacity = "0";

    // Hide after fade
    setTimeout(() => {
      overlay.style.display = "none";
    }, 800);

    // Desktop debug: enter AR (or stay in IMU mode)
    try {
      scene.setAttribute(
        "webxr",
        "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
      );
      await scene.enterAR();
    } catch (e) {
      console.warn("AR entry failed (expected on desktop):", e);
    }

    // Play intro audio
    intro.components.sound.playSound();
  });
};
