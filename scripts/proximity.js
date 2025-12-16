/* =====================================================
   WASD CONTROL HELPER (DEBUG ONLY)
   ===================================================== */
function setWASDEnabled(enabled) {
  if (!window.__DEBUG_MODE__) return;

  const camera = document.querySelector("#camera");
  if (!camera) return;

  camera.setAttribute("wasd-controls", {
    enabled,
    fly: true,
    acceleration: 35
  });
}

/* =====================================================
   SOFT PULSE + GENTLE BOUNCE
   ===================================================== */
AFRAME.registerComponent("soft-pulse", {
  schema: {
    scaleMin: { type: "number", default: 0.97 },
    scaleMax: { type: "number", default: 1.03 },
    bounce: { type: "number", default: 0.025 },
    duration: { type: "number", default: 2600 }
  },

  init() {
    const el = this.el;
    const y = el.object3D.position.y;

    el.setAttribute("animation__scale", {
      property: "scale",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      to: `${this.data.scaleMax} ${this.data.scaleMax} ${this.data.scaleMax}`
    });

    el.setAttribute("animation__bounce", {
      property: "position",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      to: `${el.object3D.position.x} ${y + this.data.bounce} ${el.object3D.position.z}`
    });
  }
});

/* =====================================================
   GUIDANCE GLOW
   ===================================================== */
AFRAME.registerComponent("guidance-glow", {
  init() {
    this.el.setAttribute("material", "emissive", "#ffffff");
    this.el.setAttribute("material", "emissiveIntensity", 0.25);

    this.el.setAttribute("animation__glow", {
      property: "material.emissiveIntensity",
      from: 0.25,
      to: 0.7,
      dir: "alternate",
      dur: 1800,
      easing: "easeInOutSine",
      loop: true
    });
  },

  remove() {
    this.el.removeAttribute("animation__glow");
    this.el.setAttribute("material", "emissiveIntensity", 0);
  }
});

/* =====================================================
   PATH NODE
   explore_more is the ONLY silent node
   ===================================================== */
AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] }
  },

  init() {
    this.triggered = false;
    this.system = this.el.sceneEl.systems["path-manager"];
    this.sound = null;

    // Silent node
    if (this.data.id === "explore_more") return;

    const audioSrc = `assets/audio/${this.data.id}.wav`;

    fetch(audioSrc, { method: "HEAD" })
      .then(r => {
        if (!r.ok) throw new Error();
        this.sound = document.createElement("a-entity");
        this.sound.setAttribute("sound", {
          src: `url(${audioSrc})`,
          autoplay: false,
          positional: true
        });
        this.el.appendChild(this.sound);
      })
      .catch(() => {});
  },

  tick() {
    if (this.triggered) return;

    const cam = this.el.sceneEl.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    if (cam.distanceTo(pos) < 0.75) {
      this.triggered = true;
      this.el.removeAttribute("guidance-glow");

      this.system?.lockRootPath?.(this.data.id);
      this.system?.lockChoice?.(this.data.id);

      this.el.setAttribute("visible", false);

      if (!this.sound?.components?.sound) {
        this.finish();
        return;
      }

      // Freeze WASD (debug only)
      setWASDEnabled(false);

      // Register active audio
      window.__CURRENT_AUDIO_NODE__ = this;

      this.sound.components.sound.playSound();
      this.sound.addEventListener(
        "sound-ended",
        () => {
          window.__CURRENT_AUDIO_NODE__ = null;
          setWASDEnabled(true);
          this.finish();
        },
        { once: true }
      );
    }
  },

  finish() {
    window.__CURRENT_AUDIO_NODE__ = null;

    this.system?.completeNode(
      this.data.id,
      this.data.next,
      this.el.object3D.position
    );

    this.el.remove();
  }
});
