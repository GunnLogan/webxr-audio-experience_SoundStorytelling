AFRAME.registerComponent("proximity-trigger", {
  schema: {
    soundA:{type:"selector"},
    soundB:{type:"selector"},
    soundC:{type:"selector"},
    soundD:{type:"selector"},

    asphere:{type:"selector"},
    bsphere:{type:"selector"},
    csphere:{type:"selector"},
    dsphere:{type:"selector"},

    ambient:{type:"selector"},
    distance:{default:1.5}
  },

  init: function () {
    this.insideZone = false;

    this.Aplayed = false;
    this.Bplayed = false;
    this.Cplayed = false;
    this.Dplayed = false;

    if (this.data.bsphere) this.data.bsphere.setAttribute("visible","false");
    if (this.data.csphere) this.data.csphere.setAttribute("visible","false");
    if (this.data.dsphere) this.data.dsphere.setAttribute("visible","false");

    const self=this;

    if (this.data.soundA) {
      this.data.soundA.addEventListener("sound-ended",()=>{
        if (self.data.bsphere) self.data.bsphere.setAttribute("visible","true");
      });
    }

    if (this.data.soundB) {
      this.data.soundB.addEventListener("sound-ended",()=>{
        if (self.data.bsphere) self.data.bsphere.setAttribute("visible","false");
        if (self.data.csphere) self.data.csphere.setAttribute("visible","true");
        if (self.data.dsphere) self.data.dsphere.setAttribute("visible","true");
      });
    }

    if (this.data.soundC) {
      this.data.soundC.addEventListener("sound-ended",()=>{
        if (self.data.csphere) self.data.csphere.setAttribute("visible","false");
      });
    }

    if (this.data.soundD) {
      this.data.soundD.addEventListener("sound-ended",()=>{
        if (self.data.dsphere) self.data.dsphere.setAttribute("visible","false");
      });
    }
  },

  tick: function () {
    const cam = this.el.sceneEl.camera.el.object3D.position;
    const pos = this.el.object3D.position;
    const dist = cam.distanceTo(pos);
    const d = this.data;
    const ambient = d.ambient?.components.sound;

    const inside = dist < d.distance;

    if (inside && !this.insideZone) {
      this.insideZone = true;

      if (d.asphere) d.asphere.setAttribute("visible","false");
      if (ambient && ambient.isPlaying) ambient.pauseSound();

      if (!this.Aplayed && d.soundA) {
        d.soundA.components.sound.playSound();
        this.Aplayed = true;
      }
    }

    if (d.bsphere && d.soundB && d.bsphere.getAttribute("visible")) {
      const bpos = d.bsphere.object3D.position;
      if (!this.Bplayed && cam.distanceTo(bpos) < d.distance) {
        d.bsphere.setAttribute("visible","false");
        d.soundB.components.sound.playSound();
        this.Bplayed = true;
      }
    }

    if (d.csphere && d.soundC && d.csphere.getAttribute("visible")) {
      const cpos = d.csphere.object3D.position;
      if (!this.Cplayed && cam.distanceTo(cpos) < d.distance) {
        d.csphere.setAttribute("visible","false");
        d.soundC.components.sound.playSound();
        this.Cplayed = true;
      }
    }

    if (d.dsphere && d.soundD && d.dsphere.getAttribute("visible")) {
      const dpos = d.dsphere.object3D.position;
      if (!this.Dplayed && cam.distanceTo(dpos) < d.distance) {
        d.dsphere.setAttribute("visible","false");
        d.soundD.components.sound.playSound();
        this.Dplayed = true;
      }
    }

    if (!inside && this.insideZone) {
      this.insideZone = false;

      [d.soundA, d.soundB, d.soundC, d.soundD].forEach(s=>{
        if (s?.components.sound) s.components.sound.stopSound();
      });

      this.Aplayed = false;
      this.Bplayed = false;
      this.Cplayed = false;
      this.Dplayed = false;

      if (d.asphere) d.asphere.setAttribute("visible","true");
      if (d.bsphere) d.bsphere.setAttribute("visible","false");
      if (d.csphere) d.csphere.setAttribute("visible","false");
      if (d.dsphere) d.dsphere.setAttribute("visible","false");

      if (ambient && !ambient.isPlaying) ambient.playSound();
    }
  }
});
