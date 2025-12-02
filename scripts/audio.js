function crossfade(intro, amb, fadeTime=2000){
  let start=null;

  function step(ts){
    if(!start) start=ts;
    let p=(ts-start)/fadeTime;
    if(p>1) p=1;

    intro.setAttribute("sound","volume",1-p);
    amb.setAttribute("sound","volume",p);

    if(p<1) requestAnimationFrame(step);
    else intro.components.sound.stopSound();
  }
  requestAnimationFrame(step);
}

function handleIntroEnded(intro, ambient){
  document.querySelectorAll("a-sphere[id^='a']").forEach(a=>{
    a.setAttribute("visible","true");
  });

  ambient.components.sound.playSound();
  crossfade(intro, ambient);
}
