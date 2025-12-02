/***********************************************************
 *  CLUSTER PROXIMITY CONTROLLER
 *  A → B → C&D progression
 *  A is one-shot per direction but reactivates when ANY other A is entered
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

  init: function () {
    this.aInside = false;
    this.bInside = false;
    this.cInside = false;
    this.dInside = false;

    // Special A-trigger rule:
    // Aused = whether A has been triggered since last directional switch
    this.Aused = false;

    this.bUnlocked = false;
    this.cUnlocked = false;
    this.dUnlocked = false;

    const d = this.data;

    if (d.asphere) d.asphere.setAttribute("visible", true);
    if (d.bsphere) d.bsphere.setAttribute("visible", false);
    if (d.csphere) d.csphere.setAttribute("visible", false);
    if (d.dsphere) d.dsphere.setAttribute("visible", false);

    // Global reference to which A was triggered last
    if (!window._lastATrigger) window._lastATrigger = null;
  },

  tick: function () {
    const sceneEl = this.el.sceneEl;
    if (!sceneEl || !sceneEl.camera) return;

    const camPos = sceneEl.camera.el.object3D.position;
    const d = this.data;

    const getDist = (sphere) => sphere ? camPos.distanceTo(sphere.object3D.position) : Infinity;

    const distA = getDist(d.asphere);
    const distB = getDist(d.bsphere);
    const distC = getDist(d.csphere);
    const distD = getDist(d.dsphere);

    /* ============================================================
       A TRIGGER — one-shot per direction, reactivates when any
       *other* A is entered
    ============================================================ */
    if (d.asphere && d.soundA?.components?.sound) {
      const inA = distA < d.distance;

      if (inA && !this.aInside) {
        const last = window._lastATrigger;

        // PLAY if:
        // - A has not been used yet OR
        // - another A direction has been triggered after this one
        if (!this.Aused || last !== this.el.id) {

          d.soundA.components.sound.playSound();

          this.Aused = true;
          window._lastATrigger = this.el.id;

          // Unlock B
          if (!this.bUnlocked) {
            this.bUnlocked = true;
            if (d.bsphere) d.bsphere.setAttribute("visible", true);
          }

          // Reset Aused on ALL OTHER CLUSTERS
          const clusters = document.querySelectorAll("[cluster-proximity]");
          clusters.forEach((cl) => {
            if (cl.id !== this.el.id) {
              cl.components["cluster-proximity"].Aused = false;
            }
          });
        }
      }

      this.aInside = inA;
    }

    /* ---------------------------
       B TRIGGER (after A)
       --------------------------- */
    if (this.bUnlocked && d.bsphere && d.soundB?.components?.sound) {
      const inB = distB < d.distance;

      if (inB && !this.bInside) {
        d.soundB.components.sound.playSound();

        if (!this.cUnlocked) {
          this.cUnlocked = true;
          if (d.csphere) d.csphere.setAttribute("visible", true);
        }

        if (!this.dUnlocked) {
          this.dUnlocked = true;
          if (d.dsphere) d.dsphere.setAttribute("visible", true);
        }
      }

      this.bInside = inB;
    }

    /* ---------------------------
       C TRIGGER
       --------------------------- */
    if (this.cUnlocked && d.csphere && d.soundC?.components?.sound) {
      const inC = distC < d.distance;

      if (inC && !this.cInside) {
        d.soundC.components.sound.playSound();
      }

      this.cInside = inC;
    }

    /* ---------------------------
       D TRIGGER
       --------------------------- */
    if (this.dUnlocked && d.dsphere && d.soundD?.components?.sound) {
      const inD = distD < d.distance;

      if (inD && !this.dInside) {
        d.soundD.components.sound.playSound();
      }

      this.dInside = inD;
    }
  }
});


/***********************************************************
 *  AMBIENT PROXIMITY SYSTEM
 *  - Half volume base (0.5)
 *  - 3D HRTF spatialisation
 *  - Low-pass filter increasing with distance
 *  - Inner plateau (0–0.5m full clarity)
 *  - Smooth fade every 10 cm
 *  - Full silent beyond 4 meters
 ***********************************************************/
AFRAME.registerComponent("ambient-proximity", {
  schema: {
    ambient: { type: "selector" },
    maxRadius: { default: 4 },
    falloff:  { default: 0.05 },
    plateau:  { default: 0.5 }
  },

  init: function () {
    this.started = false;

    const ambientEl = this.data.ambient;
    if (!ambientEl) return;

    const ctx = AFRAME.audioContext;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.5, ctx.currentTime); // half volume

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(20000, ctx.currentTime);

    this.panner = ctx.createPanner();
    this.panner.panningModel = "HRTF";
    this.panner.distanceModel = "inverse";
    this.panner.refDistance = 1;
    this.panner.rolloffFactor = 0.5;

    this.panner.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    ambientEl.components.sound.pool.children.forEach((sound) => {
      sound.setNodeSource(this.panner);
    });
  },

  tick: function () {
    const scene = this.el.sceneEl;
    if (!scene || !scene.camera) return;

    const camPos = scene.camera.el.object3D.position;
    const centerPos = this.el.object3D.position;
    const ambient = this.data.ambient?.components?.sound;

    if (!ambient) return;

    if (!this.started) {
      ambient.playSound();
      this.started = true;
    }

    const dist = camPos.distanceTo(centerPos);

    this.panner.positionX.value = centerPos.x;
    this.panner.positionY.value = centerPos.y;
    this.panner.positionZ.value = centerPos.z;

    if (dist <= this.data.plateau) {
      this.gainNode.gain.value = 0.5;
      this.filter.frequency.value = 20000;
      return;
    }

    const steps = dist / 0.1;
    let volume = Math.max(0, 0.5 * (1 - (steps * this.data.falloff)));

    if (dist > this.data.maxRadius) volume = 0;

    this.gainNode.gain.value = volume;

    const cutoffMin = 500;
    const cutoffMax = 20000;

    const t = Math.min(1, dist / this.data.maxRadius);
    const cutoff = cutoffMax - (t * (cutoffMax - cutoffMin));

    this.filter.frequency.value = cutoff;
  }
});
