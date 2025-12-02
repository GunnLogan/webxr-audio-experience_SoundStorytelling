// Cluster proximity controller
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

    distance: { default: 0.75 } // trigger radius around each sphere
  },

  init: function () {
    // Inside flags (for detecting enter vs stay)
    this.aInside = false;
    this.bInside = false;
    this.cInside = false;
    this.dInside = false;

    // Unlock state
    this.bUnlocked = false;
    this.cUnlocked = false;
    this.dUnlocked = false;

    const d = this.data;

    // Initial visibility:
    // A visible, B/C/D hidden until unlocked
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

    // Helper to get distance to a sphere, or Infinity if missing
    const getDist = (sphere) => {
      if (!sphere) return Infinity;
      return camPos.distanceTo(sphere.object3D.position);
    };

    const distA = getDist(d.asphere);
    const distB = getDist(d.bsphere);
    const distC = getDist(d.csphere);
    const distD = getDist(d.dsphere);

    // ---------------------------
    // A: always active
    // ---------------------------
    if (d.asphere && d.soundA && d.soundA.components && d.soundA.components.sound) {
      const inA = distA < d.distance;
      if (inA && !this.aInside) {
        // Just entered A-zone → play A
        d.soundA.components.sound.playSound();

        // Unlock B (once unlocked, it stays unlocked)
        if (!this.bUnlocked) {
          this.bUnlocked = true;
          if (d.bsphere) d.bsphere.setAttribute("visible", true);
        }
      }
      this.aInside = inA;
    }

    // ---------------------------
    // B: only if unlocked by A
    // ---------------------------
    if (this.bUnlocked && d.bsphere && d.soundB && d.soundB.components && d.soundB.components.sound) {
      const inB = distB < d.distance;
      if (inB && !this.bInside) {
        // Just entered B-zone → play B
        d.soundB.components.sound.playSound();

        // Unlock C and D
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

    // ---------------------------
    // C: only if unlocked by B
    // ---------------------------
    if (this.cUnlocked && d.csphere && d.soundC && d.soundC.components && d.soundC.components.sound) {
      const inC = distC < d.distance;
      if (inC && !this.cInside) {
        d.soundC.components.sound.playSound();
      }
      this.cInside = inC;
    }

    // ---------------------------
    // D: only if unlocked by B
    // ---------------------------
    if (this.dUnlocked && d.dsphere && d.soundD && d.soundD.components && d.soundD.components.sound) {
      const inD = distD < d.distance;
      if (inD && !this.dInside) {
        d.soundD.components.sound.playSound();
      }
      this.dInside = inD;
    }
  }
});


// Ambient center controller
// Plays ambience ONCE the first time the user comes within `radius` of this entity
AFRAME.registerComponent("ambient-proximity", {
  schema: {
    ambient: { type: "selector" },
    maxRadius: { default: 3 },   // maximum distance where ambience can be heard
    falloff:  { default: 0.1 }   // volume reduction per 0.1 meter
  },

  init: function () {
    this.started = false;
  },

  tick: function () {
    const scene = this.el.sceneEl;
    if (!scene || !scene.camera) return;

    const camPos = scene.camera.el.object3D.position;
    const centerPos = this.el.object3D.position;

    const ambient = this.data.ambient?.components?.sound;
    if (!ambient) return;

    // Start ambience on first detection
    if (!this.started) {
      ambient.playSound();
      this.started = true;
    }

    // Distance from center
    const dist = camPos.distanceTo(centerPos);

    // Convert 0.1m into volume steps
    const steps = dist / 0.1;

    // Falloff per step
    let volume = Math.max(0, 1 - (steps * this.data.falloff));

    // Clamp outside radius
    if (dist > this.data.maxRadius) {
      volume = 0;
    }

    ambient.volume = volume;
  }
});

