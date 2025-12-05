/***********************************************************
 *  Utility: Set opacity of spheres
 ***********************************************************/
function setSphereOpacity(sphere, opacity) {
  if (!sphere) return;
  sphere.setAttribute("material", `transparent:true; opacity:${opacity}`);
}

/***********************************************************
 *  Utility: Permanently disable a trigger sphere
 ***********************************************************/
function disableTrigger(sphere) {
  if (!sphere) return;
  sphere.dataset.triggered = "true"; // mark as inactive
  sphere.setAttribute("visible", false);
}

/***********************************************************
 *  CLUSTER PROXIMITY SYSTEM (A → B → C & D)
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

    // internal state flags
    this.aInside = false;
    this.bInside = false;
    this.cInside = false;
    this.dInside = false;

    this.bUnlocked = false;
    this.cdUnlocked = false;   // NEW: unlock C+D together

    // INITIAL VISIBILITY — only A
    if (d.asphere) { d.asphere.setAttribute("visible", true); setSphereOpacity(d.asphere, 1); }
    if (d.bsphere) d.bsphere.setAttribute("visible", false);
    if (d.csphere) d.csphere.setAttribute("visible", false);
    if (d.dsphere) d.dsphere.setAttribute("visible", false);
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

    /***********************************************************
     * A TRIGGER → hide A → show B only
     ***********************************************************/
    if (d.asphere &&
        !d.asphere.dataset.triggered &&
        d.soundA?.components?.sound) {

      const inA = distA < d.distance;

      if (inA && !this.aInside) {

        d.soundA.components.sound.playSound();

        setSphereOpacity(d.asphere, 0.25);
        setTimeout(() => disableTrigger(d.asphere),
          d.soundA.components.sound.duration * 1000
        );

        // SHOW ONLY B
        d.bsphere.setAttribute("visible", true);
        setSphereOpacity(d.bsphere, 1);

        this.bUnlocked = true;
      }

      this.aInside = inA;
    }


    /***********************************************************
     * B TRIGGER → hide B → show C + D (branching mode)
     ***********************************************************/
    if (this.bUnlocked &&
        d.bsphere &&
        !d.bsphere.dataset.triggered &&
        d.soundB?.components?.sound) {

      const inB = distB < d.distance;

      if (inB && !this.bInside) {

        d.soundB.components.sound.playSound();

        setSphereOpacity(d.bsphere, 0.25);
        setTimeout(() => disableTrigger(d.bsphere),
          d.soundB.components.sound.duration * 1000
        );

        // SHOW BOTH C and D — the branch moment
        d.csphere.setAttribute("visible", true);
        d.dsphere.setAttribute("visible", true);

        setSphereOpacity(d.csphere, 1);
        setSphereOpacity(d.dsphere, 1);

        this.cdUnlocked = true; // both available
      }

      this.bInside = inB;
    }


    /***********************************************************
     * C TRIGGER → hide C ONLY (D still available)
     ***********************************************************/
    if (this.cdUnlocked &&
        d.csphere &&
        !d.csphere.dataset.triggered &&
        d.soundC?.components?.sound) {

      const inC = distC < d.distance;

      if (inC && !this.cInside) {

        d.soundC.components.sound.playSound();

        setSphereOpacity(d.csphere, 0.25);
        setTimeout(() => disableTrigger(d.csphere),
          d.soundC.components.sound.duration * 1000
        );
      }

      this.cInside = inC;
    }


    /***********************************************************
     * D TRIGGER → hide D ONLY (C might still be active)
     ***********************************************************/
    if (this.cdUnlocked &&
        d.dsphere &&
        !d.dsphere.dataset.triggered &&
        d.soundD?.components?.sound) {

      const inD = distD < d.distance;

      if (inD && !this.dInside) {

        d.soundD.components.sound.playSound();

        setSphereOpacity(d.dsphere, 0.25);
        setTimeout(() => disableTrigger(d.dsphere),
          d.soundD.components.sound.duration * 1000
        );
      }

      this.dInside = inD;
    }
  }
});


/***********************************************************
 *  AMBIENT PROXIMITY (unchanged)
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
