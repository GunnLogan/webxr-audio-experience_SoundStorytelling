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

    // Initial visibility setup
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

    // Helper distance function
    const dist = (sphere) =>
      sphere ? camPos.distanceTo(sphere.object3D.position) : Infinity;

    const distA = dist(d.asphere);
    const distB = dist(d.bsphere);
    const distC = dist(d.csphere);
    const distD = dist(d.dsphere);


    /* ============================================================
       A TRIGGER → unlock B
    ============================================================ */
    if (d.asphere &&
        d.soundA?.components?.sound &&
        !d.asphere.dataset.triggered) {

      const inA = distA < d.distance;

      if (inA && !this.aInside) {

        if (!this.Aused || window._lastATrigger !== this.el.id) {

          d.soundA.components.sound.playSound();
          this.Aused = true;
          window._lastATrigger = this.el.id;

          setSphereOpacity(d.asphere, 0.25);
          setTimeout(() => disableTrigger(d.asphere),
            d.soundA.components.sound.duration * 1000
          );

          // Unlock B
          this.bUnlocked = true;
          d.bsphere.setAttribute("visible", true);
          setSphereOpacity(d.bsphere, 1.0);

          // Reset A triggers on OTHER clusters
          document.querySelectorAll("[cluster-proximity]").forEach((cl) => {
            if (cl.id !== this.el.id) {
              cl.components["cluster-proximity"].Aused = false;
            }
          });
        }
      }

      this.aInside = inA;
    }


    /* ============================================================
       B TRIGGER → unlock C and D
    ============================================================ */
    if (this.bUnlocked &&
        d.bsphere &&
        d.soundB?.components?.sound &&
        !d.bsphere.dataset.triggered) {

      const inB = distB < d.distance;

      if (inB && !this.bInside) {

        d.soundB.components.sound.playSound();

        setSphereOpacity(d.bsphere, 0.25);
        setTimeout(() => disableTrigger(d.bsphere),
          d.soundB.components.sound.duration * 1000
        );

        // Unlock C + D
        this.cUnlocked = true;
        this.dUnlocked = true;

        d.csphere.setAttribute("visible", true);
        setSphereOpacity(d.csphere, 1);

        d.dsphere.setAttribute("visible", true);
        setSphereOpacity(d.dsphere, 1);
      }

      this.bInside = inB;
    }


    /* ============================================================
       C TRIGGER
    ============================================================ */
    if (this.cUnlocked &&
        d.csphere &&
        d.soundC?.components?.sound &&
        !d.csphere.dataset.triggered) {

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


    /* ============================================================
       D TRIGGER
    ============================================================ */
    if (this.dUnlocked &&
        d.dsphere &&
        d.soundD?.components?.sound &&
        !d.dsphere.dataset.triggered) {

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
 *  AMBIENT SPATIAL PROXIMITY SYSTEM (unchanged)
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

    const ambientEl = this.data.ambient;
    if (!ambientEl?.components?.sound) return;

    const sound = ambientEl.components.sound;
    const camPos = scene.camera.el.object3D.position;
    const pos = this.el.object3D.position;

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
