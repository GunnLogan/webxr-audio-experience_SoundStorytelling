/***********************************************************
 *  CLUSTER PROXIMITY CONTROLLER (A → B → C&D progression)
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

    this.bUnlocked = false;
    this.cUnlocked = false;
    this.dUnlocked = false;

    const d = this.data;

    if (d.asphere) d.asphere.setAttribute("visible", true);
    if (d.bsphere) d.bsphere.setAttribute("visible", false);
    if (d.csphere) d.csphere.setAttribute("visible", false);
    if (d.dsphere) d.dsphere.setAttribute("visible", false);
  },

  tick: function () {
    const sceneEl = this.el.sceneEl;
    if (!sceneEl || !sceneEl.camera) return;

    const camPos = sceneEl.camera.el.object3D.position;
    const d = this.data;

    const getDist = (sphere) => {
      if (!sphere) return Infinity;
      return camPos.distanceTo(sphere.object3D.position);
    };

    const distA = getDist(d.asphere);
    const distB = getDist(d.bsphere);
    const distC = getDist(d.csphere);
    const distD = getDist(d.dsphere);

    /* -------------------
       A TRIGGER (always active)
       ------------------- */
    if (d.asphere && d.soundA?.components?.sound) {
      const inA = distA < d.distance;

      if (inA && !this.aInside) {
        d.soundA.components.sound.playSound();

        if (!this.bUnlocked) {
          this.bUnlocked = true;
          if (d.bsphere) d.bsphere.setAttribute("visible", true);
        }
      }
      this.aInside = inA;
    }

    /* -------------------
       B TRIGGER
       ------------------- */
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

    /* -------------------
       C TRIGGER
       ------------------- */
    if (this.cUnlocked && d.csphere && d.soundC?.components?.sound) {
      const inC = distC < d.distance;

      if (inC && !this.cInside) {
        d.soundC.components.sound.playSound();
      }

      this.cInside = inC;
    }

    /* -------------------
       D TRIGGER
       ------------------- */
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
 *  - Volume fades by 0.05 every 10cm
 *  - Max radius = 4m
 *  - Inner plateau at 0.5m (full volume)
 *  - Smooth low-pass filter
 *  - 3D HRTF spatialisation
 ***********************************************************/
AFRAME.registerComponent("ambient-proximity", {
  schema: {
    ambient: { type: "selector" },
    maxRadius: { default: 4 },     // ambience fades to silence at 4m
    falloff:  { default: 0.05 },   // 5% volume drop per 10 cm
    plateau:  { default: 0.5 }     // inner radius with full volume
  },

  init: function () {
    this.started = false;

    const ambientEl = this.data.ambient;
    if (!ambientEl) return;

    const ctx = AFRAME.audioContext;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(1, ctx.currentTime);

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

    /* Start ambience once */
    if (!this.started) {
      ambient.playSound();
      this.started = true;
    }

    const dist = camPos.distanceTo(centerPos);

    /* Update panner spatialisation */
    this.panner.positionX.value = centerPos.x;
    this.panner.positionY.value = centerPos.y;
    this.panner.positionZ.value = centerPos.z;

    /* -------------------------
       INNER PLATEAU ZONE
       ------------------------- */
    if (dist <= this.data.plateau) {
      this.gainNode.gain.value = 1.0;       // full volume
      this.filter.frequency.value = 20000;  // no filtering
      return;
    }

    /* -------------------------
       VOLUME FALLOFF
       ------------------------- */
    const steps = dist / 0.1; // each 10cm
    let volume = Math.max(0, 1 - (steps * this.data.falloff));

    if (dist > this.data.maxRadius) {
      volume = 0;
    }

    this.gainNode.gain.value = volume;

    /* -------------------------
       DISTANCE-BASED LOW-PASS
       ------------------------- */
    const cutoffMin = 500;     // muffled far
    const cutoffMax = 20000;   // clear near

    const t = Math.min(1, dist / this.data.maxRadius);
    const cutoff = cutoffMax - (t * (cutoffMax - cutoffMin));

    this.filter.frequency.value = cutoff;
  }
});
