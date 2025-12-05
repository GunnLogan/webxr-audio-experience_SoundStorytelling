/***********************************************************
 * Utility: Set opacity of spheres
 ***********************************************************/
function setSphereOpacity(sphere, opacity) {
  if (!sphere) return;
  sphere.setAttribute("material", `transparent:true; opacity:${opacity}`);
}

/***********************************************************
 * Utility: Permanently disable a trigger
 ***********************************************************/
function disableTrigger(sphere) {
  if (!sphere) return;
  sphere.dataset.triggered = "true";
  sphere.setAttribute("visible", false);
}

/***********************************************************
 * CLUSTER PROXIMITY — Unlock NEXT sphere(s) only AFTER audio ends
 ***********************************************************/
AFRAME.registerComponent("cluster-proximity", {
  schema: {
    soundA: { type: "selector" },
    soundB: { type: "selector" },
    soundC: { type: "selector" },
    soundD: { type: "selector" },

    asphere: { type: "selector" },
    bsphere: { type: "selector" },
    csphere: { type: "selector" },
    dsphere: { type: "selector" },

    distance: { default: 0.75 }
  },

  init() {
    const d = this.data;

    // State flags
    this.aInside = false;
    this.bInside = false;
    this.cInside = false;
    this.dInside = false;

    this.bUnlocked = false;
    this.cdUnlocked = false;

    // Start state — only A visible
    d.asphere.setAttribute("visible", true);
    setSphereOpacity(d.asphere, 1);

    d.bsphere.setAttribute("visible", false);
    d.csphere.setAttribute("visible", false);
    d.dsphere.setAttribute("visible", false);
  },

  tick() {
    const d = this.data;
    const scene = this.el.sceneEl;
    if (!scene?.camera) return;

    const camPos = scene.camera.el.object3D.position;

    const dist = sphere =>
      sphere ? camPos.distanceTo(sphere.object3D.position) : Infinity;

    const Anear = dist(d.asphere) < d.distance;
    const Bnear = dist(d.bsphere) < d.distance;
    const Cnear = dist(d.csphere) < d.distance;
    const Dnear = dist(d.dsphere) < d.distance;

    /***********************************************************
     * A TRIGGER → Wait until A finishes → then show B
     ***********************************************************/
    if (!d.asphere.dataset.triggered &&
        d.soundA?.components?.sound) {

      if (Anear && !this.aInside) {

        d.soundA.components.sound.playSound();
        setSphereOpacity(d.asphere, 0.25);

        const duration = d.soundA.components.sound.duration * 1000;

        setTimeout(() => {
          disableTrigger(d.asphere);

          // AFTER A FINISHES → Show B
          d.bsphere.setAttribute("visible", true);
          setSphereOpacity(d.bsphere, 1);

          this.bUnlocked = true;
        }, duration);
      }

      this.aInside = Anear;
    }


    /***********************************************************
     * B TRIGGER → Wait until B finishes → then show C & D
     ***********************************************************/
    if (this.bUnlocked &&
        !d.bsphere.dataset.triggered &&
        d.soundB?.components?.sound) {

      if (Bnear && !this.bInside) {

        d.soundB.components.sound.playSound();
        setSphereOpacity(d.bsphere, 0.25);

        const duration = d.soundB.components.sound.duration * 1000;

        setTimeout(() => {
          disableTrigger(d.bsphere);

          // AFTER B FINISHES → SHOW C & D
          d.csphere.setAttribute("visible", true);
          d.dsphere.setAttribute("visible", true);

          setSphereOpacity(d.csphere, 1);
          setSphereOpacity(d.dsphere, 1);

          this.cdUnlocked = true;

        }, duration);
      }

      this.bInside = Bnear;
    }


    /***********************************************************
     * C TRIGGER → hide only after C finishes
     ***********************************************************/
    if (this.cdUnlocked &&
        !d.csphere.dataset.triggered &&
        d.soundC?.components?.sound) {

      if (Cnear && !this.cInside) {

        d.soundC.components.sound.playSound();
        setSphereOpacity(d.csphere, 0.25);

        const duration = d.soundC.components.sound.duration * 1000;

        setTimeout(() => disableTrigger(d.csphere), duration);
      }

      this.cInside = Cnear;
    }


    /***********************************************************
     * D TRIGGER → hide only after D finishes
     ***********************************************************/
    if (this.cdUnlocked &&
        !d.dsphere.dataset.triggered &&
        d.soundD?.components?.sound) {

      if (Dnear && !this.dInside) {

        d.soundD.components.sound.playSound();
        setSphereOpacity(d.dsphere, 0.25);

        const duration = d.soundD.components.sound.duration * 1000;

        setTimeout(() => disableTrigger(d.dsphere), duration);
      }

      this.dInside = Dnear;
    }
  }
});


/***********************************************************
 * AMBIENT PROXIMITY (unchanged)
 ***********************************************************/
AFRAME.registerComponent("ambient-proximity", {
  schema: {
    ambient: { type: "selector" },
    maxRadius: { default: 4 },
    falloff: { default: 0.05 },
    plateau: { default: 0.5 }
  },

  tick() {
    if (!window._experienceStarted) return;

    const scene = this.el.sceneEl;
    if (!scene?.camera) return;

    const amb = this.data.ambient;
    if (!amb?.components?.sound) return;

    const sound = amb.components.sound;
    const camPos = scene.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    const dist = camPos.distanceTo(pos);
    let vol = 0.5;

    if (dist > this.data.plateau) {
      const steps = dist / 0.1;
      vol = Math.max(0, 0.5 * (1 - steps * this.data.falloff));
      if (dist > this.data.maxRadius) vol = 0;
    }

    amb.setAttribute("sound", "volume", vol);
  }
});
