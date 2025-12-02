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

    // Start with only A visible
    if (this.data.asphere) this.data.asphere.setAttribute("visible","true");
    if (this.data.bsphere) this.data.bsphere.setAttribute("visible","false");
    if (this.data.csphere) this.data.csphere.setAttribute("visible","false");
    if (this.data.dsphere) this.data.dsphere.setAttribute("visible","false");

    const self = this;

    // A ends -> show B
    if (this.data.soundA) {
      this.data.soundA.addEventListener("sound-ended", () => {
        if (self.data.bsphere)
          self.data.bsphere.setAttribute("visible","true");
      });
    }

    // B ends -> show C + D
    if (this.data.soundB) {
      this.data.soundB.addEventListener("sound-ended", () => {
        if (self.data.bsphere)
          self.data.bsphere.setAttribute("visible","false");

        if (self.data.csphere)
          self.data.csphere.setAttribute("visible","true");
        if (self.data.dsphere)
          self.data.dsphere.setAttribute("visible","true");
      });
    }

    // C ends -> hide C
    if (this.data.soundC) {
      this.data.soundC.addEventListener("sound-ended", () => {
        if (self.data.csphere)
          self.data.csphere.setAttribute("visible","false");
      });
    }

    // D ends -> hide D
    if (this.data.soundD) {
      this.data.soundD.addEventListener("sound-ended", () => {
        if (self.data.dsphere)
          self.data.dsphere.setAttribute("visible","false");
      });
    }
  },

  tick: function () {
    const camPos = this.el.sceneEl.camera.el.object3D.position;
    const triggerPos = this.el.object3D.position;
    const triggerDist = camPos.distanceTo(triggerPos);

    const d = this.data;
    const ambient = d.ambient?.components.sound;

    const inside = triggerDist < d.distance;

    // ENTER -> start A
    if (inside && !this.insideZone) {

      this.insideZone = true;

      if (d.asphere) d.asphere.setAttribute("visible","false");

      if (ambient && ambient.isPlaying)
        ambient.pauseSound();

      if (!this.Aplayed && d.soundA) {
        d.soundA.components.sound.playSound();
        this.Aplayed = true;
      }
    }

    // B trigger (based on trigger distance, not sphere position)
    if (this.insideZone && d.bsphere && d.bsphere.getAttribute("visible")) {

      if (!this.Bplayed && inside) {
        d.bsphere.setAttribute("visible","false");
        d.soundB.components.sound.playSound();
        this.Bplayed = true;
      }
    }

    // C trigger
    if (this.insideZone && d.csphere && d.csphere.getAttribute("visible")) {

      if (!this.Cplayed && inside) {
        d.csphere.setAttribute("visible","false");
        d.soundC.components.sound.playSound();
        this.Cplayed = true;
      }
    }

    // D trigger
    if (this.insideZone && d.dsphere && d.dsphere.getAttribute("visible")) {

      if (!this.Dplayed && inside) {
        d.dsphere.setAttribute("visible","false");
        d.soundD.components.sound.playSound();
        this.Dplayed = true;
      }
    }

    // EXIT -> reset constellation
    if (!inside && this.insideZone) {

      this.insideZone = false;

      [d.soundA, d.soundB, d.soundC, d.soundD].forEach((s) => {
        if (s?.components.sound)
          s.components.sound.stopSound();
      });

      this.Aplayed = false;
      this.Bplayed = false;
      this.Cplayed = false;
      this.Dplayed = false;

      if (d.asphere) d.aspher
