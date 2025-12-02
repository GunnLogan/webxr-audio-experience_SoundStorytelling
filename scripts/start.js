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
    const overlay = document.querySelector("#startOverlay");
    const intro = document.querySelector("#intro");
    const ambient = document.querySelector("#ambient");
    const scene = document.querySelector("a-scene");

    overlay.style.display = "none";

    // -------------------------------
    // iPHONE MODE (Audio-Only)
    // -------------------------------
    if (isIOS()) {
      intro.components.sound.playSound();
      intro.addEventListener("sound-ended", () =>
        handleIntroEnded(intro, ambient)
      );
      return;
    }

    // -------------------------------
    // ANDROID / DESKTOP AR MODE
    // -------------------------------
    scene.setAttribute(
      "webxr",
      "optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;"
    );

    try {
      await scene.enterAR();  
    } catch (e) {
      console.warn("AR entry failed:", e);
    }
 }
    // Delay for WebXR act
