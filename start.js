function isIOS(){ return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

document.querySelector("#startButton").addEventListener("click", async()=>{
  const overlay=document.querySelector("#startOverlay");
  const intro=document.querySelector("#intro");
  const ambient=document.querySelector("#ambient");
  const scene=document.querySelector("a-scene");

  overlay.style.display="none";

  if(isIOS()){
    intro.components.sound.playSound();
    intro.addEventListener("sound-ended",()=>handleIntroEnded(intro,ambient));
    return;
  }

  scene.setAttribute("webxr","optionalFeatures: hit-test, local-floor; requiredFeatures: hit-test;");

  try{ await scene.enterAR(); }catch(e){ console.warn("AR failed",e); }

  await new Promise(r=>setTimeout(r,300));

  intro.components.sound.playSound();
  intro.addEventListener("sound-ended",()=>handleIntroEnded(intro,ambient));
});
