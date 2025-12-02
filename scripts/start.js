function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

window.onload = () => {
  const startButton = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const scene = document.querySelector("a-scene");
  const intro = document.querySelector("#intro");

  let started = false;

  if (!startButton) {
    console.error("ERROR: #startButton not found in DOM");
    return;
  }

  startButton.addEventListener("click", async () => {
    if (started) return;  // ensure intro runs only once
    started = true;

    if (overlay) {
      overlay.style.display = "none";
    }

    if (!intro || !scene) {
      console.error("ERROR: intro or scene not found in DOM");
      return;
    }

    // iOS: audio-only mode
    if (isIOS()) {
      if (intro.components && intro.components.sound) {
        intro.components.sound.playSound();
      } else {
        console.warn("Intro sound component not ready yet.");
      }
      return;
    }

    // Android / Desktop: AR mode
    scene.setAttribute(
      "webxr",
      "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
    );

    try {
      if (scene.enterAR) {
        await scene.enterAR();
      } else {
        console.warn("enterAR() not available on this browser.");
      }
    } catch (e) {
      console.warn("AR entry failed:", e);
    }

    // Small delay to let WebXR session stabilize, then play intro once
    setTimeout(() => {
      if (intro.components && intro.components.sound) {
        intro.components.sound.playSound();
      } else {
        console.warn("Intro sound component not ready yet (after AR).");
      }
    }, 500);
  });
};
