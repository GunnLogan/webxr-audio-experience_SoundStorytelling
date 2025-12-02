function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

window.onload = () => {

  const startButton = document.querySelector("#startButton");
  if (!startButton) {
    console.error("ERROR: #startButton not found in DOM");
    return;
  }

  startButton.addEventListener("click", async () => {

    // IMPORTANT FIX: Unlock Web Audio
    if (AFRAME.audioContext.state === "suspended") {
      await AFRAME.audioContext.resume();
    }

    const overlay = document.querySelector("#startOverlay");
    const intro = document.querySelector("#intro");
    const ambient = document.querySelector("#ambient");
    const scene = document.querySelector("a-scene");

    overlay.style.display = "none";

    // iPhone: audio-only mode
    if (isIOS()) {
      intro.components.sound.playSound();
      return;
    }

    // Android / Desktop AR
    scene.setAttribute(
      "webxr",
      "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
    );

    try {
      await scene.enterAR();
    } catch (e) {
      console.warn("AR entry failed:", e);
    }

    intro.components.sound.playSound();
  });
};
