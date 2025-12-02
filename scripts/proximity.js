/***********************************************************
 *  Utility: Wait for Web Audio context
 ***********************************************************/
async function waitForAudioContext() {
  while (!AFRAME.audioContext) {
    await new Promise((r) => setTimeout(r, 10));
  }
  return AFRAME.audioContext;
}

/***********************************************************
 *  Utility: Create spatial mono HRTF panner for a sound node
 ***********************************************************/
async function makeSpatial(node) {
  const ctx = await waitForAudioContext();
  if (!ctx) return;

  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.rolloffFactor = 1;

  panner.connect(ctx.destination);
  node.setNodeSource(panner);
}

/***********************************************************
 *  Utility: Set opacity of spheres
 ***********************************************************/
function setSphereOpacity(sphere, opacity) {
  if (!sphere) return;
  sphere.setAttribute("material", "transparent:true; opacity:" + opacity);
}

/***********************************************************
 *  CLUSTER PROXIMITY CONTROLLER
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

    this.Aused = false;
    this.bUnlocked = false;
    this.cUnlocked = false;
    this.dUnlocked = false;

    const d = this.data;

    // Initial visibility
    d.asphere && d.asphere.setAttribute("visible", true);
    d.bsphere && d.bsphere.setAttribute("visible", false);
    d.csphere && d.csphere.setAttribute("visible", false);
    d.dsphere && d.dsphere.setAttribute("visible", false);

    // Full opacity for A at start
    setSphereOpacity(d.asphere, 1.0);

    if (!window._lastATrigger) window._lastATrigger = null;

    // Spatialize all cluster sounds
    [d.soundA, d.soundB, d.soundC, d.soundD].forEach((snd) => {
      if (!snd || !snd.components.sound) return;
      snd.components.sound.pool.children.forEach(async (node) => {
        await makeSpatial(node);
      });
    });
  },

  tick: function () {
    const scene = this.el.sceneEl;
    if (!scene || !scene.camera) return;

    const camPos = scene.camera.el.object3D.position;
    const d = this.data;

    const dist = (sphere) =>
      sphere ? camPos.distanceTo(sphere.object3D.position) : Infinity;

    const distA = dist(d.asphere);
    const distB = dist(d.bsphere);
    const distC = dist(d.csphere);
    const distD = dist(d.dsphere);

    /* ============================================================
       A TRIGGER  → enables B
    ============================================================ */
    if (d.asphere && d.soundA?.components?.sound) {
      const inA = distA < d.distance;

      if (inA && !this.aInside) {

        const last = window._lastATrigger;

        if (!this.Aused || last !== this.el.id) {

          d.soundA.components.sound.playSound();

          this.Aused = true;
          window._lastATrigger = this.el.id;

          setSphereOpacity(d.asphere, 0.25);

          setTimeout(() => {
            d.asphere && d.asphere.setAttribute("visible", false);
          }, d.soundA.components.sound.duration * 1000);

          // 🔥 Unlock B
          this.bUnlocked = true;
          d.bsphere.setAttribute("visible", true);
          setSphereOpacity(d.bsphere, 1.0);

          // Reset Aused on other clusters
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

    /* ============================================================
       B TRIGGER  → enables C and D
    ============================================================ */
    if (this.bUnlocked && d.bsphere && d.soundB?.components?.sound) {
      const inB = distB < d.distance;

      if (inB && !this.bInside) {

        d.soundB.components.sound.playSound();

        setSphereOpacity(d.bsphere, 0.25);

        setTimeout(() => {
          d.bsphere && d.bsphere.setAttribute("visible", false);
        }, d.soundB.components.sound.duration * 1000);

        // 🔥 Unlock C and D
        this.cUnlocked = true;
        d.csphere.setAttribute("visible", true);
        setSphereOpacity(d.csphere, 1.0);

        this.dUnlocked = true;
        d.dsphere.setAttribute("visible", true);
        setSphereOpacity(d.dsphere, 1.0);
      }

      this.bInside = inB;
    }

    /* ============================================================
       C TRIGGER
    ============================================================ */
    if (this.cUnlocked && d.csphere && d.soundC?.components?.sound) {
      const inC = distC < d.distance;

      if (inC && !this.cInside) {
        d.soundC.components.sound.playSound();
        setSphereOpacity(d.csphere, 0.25);

        setTimeout(() => {
          d.csphere && d.csphere.setAttribute("visible", false);
        }, d.soundC.components.sound.duration * 1000);
      }

      this.cInside = inC;
    }

    /* ============================================================
       D TRIGGER
    ============================================================ */
    if (this.dUnlocked && d.dsphere && d.soundD?.components?.sound) {
      const inD = distD < d.distance;

      if (inD && !this.dInside) {
        d.soundD.components.sound.playSound();
        setSphereOpacity(d.dsphere, 0.25);

        setTimeout(() => {
          d.dsphere && d.dsphere.setAttribute("visible", false);
        }, d.soundD.components.sound.duration * 1000);
      }

      this.dInside = inD;
    }
  }
});


/***********************************************************
 *  AMBIENT SPATIAL PROXIMITY SYSTEM
 ***********************************************************/
AFRAME.registerComponent("ambient-proximity", {
  schema: {
    ambient: { type: "selector" },
    maxRadius: { default: 4 },
    falloff: { default: 0.05 },
    plateau: { default: 0.5 }
  },

  async init() {
    this.started = false;
    this.ready = false;

    const ambientEl = this.data.ambient;
    if (!ambientEl) return;

    const ctx = await waitForAudioContext();
    if (!ctx) return;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.5, ctx.currentTime);

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

    // 🔥 Wait until pool is ready
    let tries = 0;
    while (
      (!ambientEl.components.sound?.pool?.children ||
        ambientEl.components.sound.pool.children.length === 0) &&
      tries < 200
    ) {
      await new Promise((r) => setTimeout(r, 20));
      tries++;
    }

    if (!ambientEl.components.sound.pool.children.length) {
      console.warn("Ambient sound pool not ready.");
      return;
    }

    ambientEl.components.sound.pool.children.forEach((n) => {
      n.setNodeSource(this.panner);
    });

    this.ready = true;
  },

  tick() {
    if (!
