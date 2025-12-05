/***********************************************************
 *  Utility: Set opacity of spheres
 ***********************************************************/
function setSphereOpacity(sphere, opacity) {
  if (!sphere) return;
  sphere.setAttribute("material", `transparent:true; opacity:${opacity}`);
}

/***********************************************************
 *  CLUSTER PROXIMITY SYSTEM (A → B → C/D)
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

    this.aInside = false;
    this.bInside = false;
    this.cInside = false;
    this.dInside = false;

    this.Aused = false;
    this.bUnlocked = false;
    this.cUnlocked = false;
    this.dUnlocked = false;

    if (d.asphere) { d.asphere.setAttribute("visible", true); setSphereOpacity(d.asphere, 1); }
    if (d.bsphere) d.bsphere.setAttribute("visible", false);
    if (d.csphere) d.csphere.setAttribute("visible", false);
    if (d.dsphere) d.dsphere.setAttribute("visible", false);

    if (!window._lastATrigger) window._lastATrigger = null;
  },

  tick() {
    const scene = this.el.sceneEl;
    if (!scene?.camera) return;

    const d = this.data;
    const camPos = scene.camera.el.object3D.position;

    const dist = (sphere) =>
      sphere ? camPos.distanceTo(sphere.object3D.position) : Infinity;

    const distA = dist(d.asphere);
    const distB = dist(d.bsphere);
    const distC = dist(d.csphere);
    const distD = dist(d.dsphere);

    /* ---------------- A TRIGGER ---------------- */
    if (d.asphere && d.soundA?.components?.sound) {
      const inA = distA < d.distance;

      if (inA && !this.aInside) {
        if (!this.Aused || window._lastATrigger !== this.el.id) {
          d.soundA.components.sound.playSound();

          this.Aused = true;
          window._lastATrigger = this.el.id;

          setSphereOpacity(d.asphere, 0.25);
          setTimeout(() => d.asphere.setAttribute("visible", false),
            d.soundA.components.sound.duration * 1000);

          // Unlock B
          this.bUnlocked = true;
          d.bsphere.setAttribute("visible", true);
          setSphereOpacity(d.bsphere, 1.0);
        }
      }
      this.aInside = inA;
    }

    /* ---------------- B TRIGGER ---------------- */
    if (this.bUnlocked && d.bsphere && d.soundB?.components?.sound) {
      const inB = distB < d.distance;

      if (inB && !this.bInside) {
        d.soundB.components.sound.playSound();

        setSphereOpacity(d.bsphere, 0.25);
        setTimeout(() => d.bsphere.setAttribute("visible", false),
          d.soundB.components.sound.duration * 1000);

        this.cUnlocked = true;
        this.dUnlocked = true;

        d.csphere.setAttribute("visible", true);
        setSphereOpacity(d.csphere, 1);

        d.dsphere.setAttribute("visible", true);
        setSphereOpacity(d.dsphere, 1);
      }

      this.bInside = inB;
    }

    /* ---------------- C TRIGGER ---------------- */
    if (this.cUnlocked && d.csphere && d.soundC?.components?.sound) {
      const inC = distC < d.distance;

      if (inC && !this.cInside) {
        d.soundC.components.sound.playSound();
        setSphereOpacity(d.csphere, 0.25);
        setTimeout(() => d.csphere.setAttribute("visible", false),
          d.soundC.components.sound.duration * 1000);
      }

      this.cInside = inC;
    }

    /* ---------------- D TRIGGER ---------------- */
    if (this.dUnlocked && d.dsphere && d.soundD?.components?.sound) {
      const inD = distD < d.distance;

      if (inD && !this.dInside) {
        d.soundD.components.sound.playSound();
        setSphereOpacity(d.dsphere, 0.25);
        setTimeout(() => d.dsphere.setAttribute("visible", false),
          d.soundD.components.sound.duration * 1000);
      }

      this.dInside = inD;
    }
  }
});


/***********************************************************
 *  AMBIENT PROXIMITY (volume-only)
 ***********************************************************/
AFRAME.registerComponent("ambient-proximity", {
  schema: {
    ambient: { type: "selector" },
    maxRadius: { default: 4 },
    falloff: { default: 0.05 },
    plateau: { default: 0.5 }
  },

  init() {
    this.started = false;
  },

  tick() {
    const scene = this.el.sceneEl;
    if (!scene?.camera) return;

    const ambientEl = this.data.ambient;
    if (!ambientEl?.components?.sound) return;

    const sound = ambientEl.components.sound;
    const camPos = scene.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    if (!this.started) {
      sound.playSound();
      this.started = true;
    }

    const dist = camPos.distanceTo(pos);
    let vol = 0.5;

    if (dist > this.data.plateau) {
      const steps = dist / 0.1;
      vol = Math.max(0, 0.5 * (1 - steps * this.data.falloff));
      if (dist > this.data.maxRadius) vol = 0;
    }

    ambientEl.setAttribute("sound", "volume", vol);
  }
});
