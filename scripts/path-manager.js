const CHEST_Y = 1.3;
const STEP = 0.5;

/* =====================================================
   PATH GRAPH — AUTHORITATIVE (UNCHANGED)
   ===================================================== */

const PATH_GRAPH = { /* ⬅️ UNCHANGED — omitted here for brevity */ };

/* =====================================================
   PATH MANAGER SYSTEM — FIXED
   ===================================================== */

AFRAME.registerSystem("path-manager", {
  init() {
    this.root = document.querySelector("#experienceRoot");
    this.active = new Map();
    this.played = new Set();
    this.choiceGroups = new Map();

    this.rootNodes = ["front_1", "back_1", "left_1", "right_1"];
    this.rootLocked = false;
  },

  /* ===============================
     INITIAL SPAWN
     =============================== */

  spawnInitialDirections() {
    this.clearAll();
    this.rootLocked = false;

    this.spawnNode("front_1", this.forward(1));
    this.spawnNode("back_1", this.forward(-1));
    this.spawnNode("left_1", this.right(-1));
    this.spawnNode("right_1", this.right(1));
  },

  clearAll() {
    this.root.innerHTML = "";
    this.active.clear();
    this.choiceGroups.clear();
  },

  /* ===============================
     FADE HELPERS
     =============================== */

  fadeIn(el) {
    el.object3D.scale.set(0.85, 0.85, 0.85);

    // IMPORTANT: reassert transparency properly
    el.setAttribute("material", {
      opacity: 0,
      transparent: true,
      depthWrite: false
    });

    el.setAttribute("animation__fadein_opacity", {
      property: "material.opacity",
      to: 0.65,
      dur: 600,
      easing: "easeOutQuad"
    });

    el.setAttribute("animation__fadein_scale", {
      property: "scale",
      to: "1 1 1",
      dur: 600,
      easing: "easeOutQuad"
    });
  },

  fadeOutAndRemove(el) {
    el.setAttribute("animation__fade", {
      property: "material.opacity",
      to: 0,
      dur: 600,
      easing: "easeOutQuad"
    });

    el.setAttribute("animation__scale", {
      property: "scale",
      to: "0.01 0.01 0.01",
      dur: 600,
      easing: "easeOutQuad"
    });

    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 620);
  },

  /* ===============================
     NODE SPAWNING
     =============================== */

  spawnNode(id, pos, parentId = null) {
    if (this.active.has(id) || this.played.has(id)) return;
    if (this.rootLocked && this.rootNodes.includes(id)) return;

    const def = PATH_GRAPH[id];
    if (!def) return;

    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("radius", "0.25");

    // IMPORTANT: set position via object3D for bounce compatibility
    sphere.object3D.position.set(pos.x, pos.y, pos.z);

    sphere.setAttribute("material", {
      color: def.color,
      opacity: 0.65,
      transparent: true,
      depthWrite: false
    });

    sphere.setAttribute("soft-pulse", "");
    if (parentId !== null) sphere.setAttribute("guidance-glow", "");
    sphere.setAttribute("path-node", { id, next: def.next });

    this.root.appendChild(sphere);
    this.active.set(id, sphere);

    this.fadeIn(sphere);

    if (parentId) {
      if (!this.choiceGroups.has(parentId)) {
        this.choiceGroups.set(parentId, []);
      }
      this.choiceGroups.get(parentId).push(id);
    }
  },

  /* ===============================
     LOCKING
     =============================== */

  lockRootPath(chosenId) {
    if (!this.rootNodes.includes(chosenId) || this.rootLocked) return;
    this.rootLocked = true;

    this.rootNodes.forEach(id => {
      if (id !== chosenId && this.active.has(id)) {
        this.fadeOutAndRemove(this.active.get(id));
        this.active.delete(id);
      }
    });
  },

  lockChoice(chosenId) {
    for (const [parent, children] of this.choiceGroups.entries()) {
      if (!children.includes(chosenId)) continue;

      children.forEach(id => {
        if (id !== chosenId && this.active.has(id)) {
          this.fadeOutAndRemove(this.active.get(id));
          this.active.delete(id);
        }
      });

      this.choiceGroups.delete(parent);
      break;
    }
  },

  /* ===============================
     NODE COMPLETION
     =============================== */

  completeNode(id, nextIds, origin) {
    if (this.played.has(id)) return;

    this.played.add(id);
    this.active.delete(id);
    this.lockRootPath(id);

    if (id === "explore_more") {
      this.played.clear();
      this.spawnInitialDirections();
      return;
    }

    nextIds.forEach(nextId => {
      const def = PATH_GRAPH[nextId];
      if (!def) return;

      const pos = def.offset.center
        ? new THREE.Vector3(0, CHEST_Y, 0)
        : this.computePosition(origin, def.offset);

      this.spawnNode(nextId, pos, id);
    });
  },

  /* ===============================
     POSITIONING
     =============================== */

  computePosition(origin, offset) {
    const cam = this.sceneEl.camera.el.object3D;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);

    const p = new THREE.Vector3(origin.x, CHEST_Y, origin.z);
    if (offset.forward) p.add(f.clone().multiplyScalar(offset.forward));
    if (offset.right) p.add(r.clone().multiplyScalar(offset.right));

    return p;
  },

  forward(m) {
    return { x: 0, y: CHEST_Y, z: -m };
  },

  right(m) {
    return { x: m, y: CHEST_Y, z: 0 };
  }
});
