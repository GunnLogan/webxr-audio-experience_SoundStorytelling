const CHEST_Y = 1.3;
const STEP = 0.5;           // 50 cm
const ROOT_DISTANCE = 1.2;  // 120 cm

/* =====================================================
   PATH GRAPH
   ===================================================== */

const PATH_GRAPH = {
  front_1: { color: "#ffffff", next: ["front_2"] },
  front_2: { color: "#ffffff", next: ["front_3a", "front_3b"] },
  front_3a: { color: "#ffffff", next: ["front_4a"] },
  front_3b: { color: "#ffffff", next: ["front_4b"] },
  front_4a: { color: "#ffffff", next: ["front_5a"] },
  front_4b: { color: "#ffffff", next: ["front_5b"] },
  front_5a: { color: "#ffffff", next: ["end_b", "end_a"] },
  front_5b: { color: "#ffffff", next: ["end_b", "end_a"] },

  back_1: { color: "#000000", next: ["back_2"] },
  back_2: { color: "#000000", next: ["back_3a", "back_3b"] },
  back_3a: { color: "#000000", next: ["back_4a"] },
  back_3b: { color: "#000000", next: ["back_4b"] },
  back_4a: { color: "#000000", next: ["back_5a"] },
  back_4b: { color: "#000000", next: ["back_5b"] },
  back_5a: { color: "#000000", next: ["end_b", "end_a"] },
  back_5b: { color: "#000000", next: ["end_b", "end_a"] },

  left_1: { color: "#ff0000", next: ["left_2"] },
  left_2: { color: "#ff0000", next: ["left_3a", "left_3b"] },
  left_3a: { color: "#ff0000", next: ["left_4a"] },
  left_3b: { color: "#ff0000", next: ["left_4b"] },
  left_4a: { color: "#ff0000", next: ["end_b", "end_a"] },
  left_4b: { color: "#ff0000", next: ["end_b", "end_a"] },

  right_1: { color: "#0066ff", next: ["right_2"] },
  right_2: { color: "#0066ff", next: ["right_3a", "right_3b"] },
  right_3a: { color: "#0066ff", next: ["right_4a"] },
  right_3b: { color: "#0066ff", next: ["right_4b"] },
  right_4a: { color: "#0066ff", next: ["right_5a", "right_5b"] },
  right_4b: { color: "#0066ff", next: ["right_5b", "right_5c"] },
  right_5a: { color: "#0066ff", next: ["right_6a"] },
  right_5b: { color: "#0066ff", next: ["right_6b"] },
  right_5c: { color: "#0066ff", next: ["right_6c"] },
  right_6a: { color: "#0066ff", next: ["right_7"] },
  right_6b: { color: "#0066ff", next: ["right_7"] },
  right_6c: { color: "#0066ff", next: ["right_7"] },
  right_7: { color: "#0066ff", next: ["end_b", "end_a"] },

  end_a: { color: "#88ffee", next: ["explore_more"] },
  end_b: { color: "#ff4444", next: ["bomb_end"] },

  explore_more: { color: "#ffffff", next: [] },
  bomb_end: { color: "#000000", next: [] }
};

/* =====================================================
   PATH MANAGER SYSTEM
   ===================================================== */

AFRAME.registerSystem("path-manager", {
  init() {
    this.root = document.querySelector("#experienceRoot");
    this.active = new Map();
    this.played = new Set();
  },

  /* ---------------- ROOTS ---------------- */
  spawnInitialDirections() {
    this.clearAll();

    this.spawnNode("front_1", this.forward(ROOT_DISTANCE));
    this.spawnNode("back_1", this.forward(-ROOT_DISTANCE));
    this.spawnNode("left_1", this.right(-ROOT_DISTANCE));
    this.spawnNode("right_1", this.right(ROOT_DISTANCE));
  },

  clearAll() {
    this.root.innerHTML = "";
    this.active.clear();
  },

  spawnNode(id, position) {
    if (this.active.has(id) || this.played.has(id)) return;

    const def = PATH_GRAPH[id];
    const el = document.createElement("a-sphere");

    el.setAttribute("radius", 0.25);
    el.setAttribute("position", position);
    el.setAttribute("material", {
      color: def.color,
      opacity: 0.6,
      transparent: true
    });

    el.setAttribute("soft-pulse", "");
    el.setAttribute("path-node", { id, next: def.next });

    this.root.appendChild(el);
    this.active.set(id, el);
  },

  /* ---------------- PROGRESSION ---------------- */
  completeNode(id, nextIds) {
    if (this.played.has(id)) return;
    this.played.add(id);

    // Remove ALL other active nodes (siblings)
    this.active.forEach((el, key) => {
      if (key !== id) el.remove();
    });
    this.active.clear();

    if (id === "explore_more") {
      this.played.clear();
      this.spawnInitialDirections();
      return;
    }

    // Spawn next
    if (nextIds.length === 1) {
      this.spawnNode(nextIds[0], this.forwardFromCamera(STEP));
    } else {
      this.spawnNode(nextIds[0], this.diagonalFromCamera(-STEP, STEP));
      this.spawnNode(nextIds[1], this.diagonalFromCamera(STEP, STEP));
    }
  },

  /* ---------------- POSITION HELPERS ---------------- */
  forward(d) {
    return new THREE.Vector3(0, CHEST_Y, -d);
  },

  right(d) {
    return new THREE.Vector3(d, CHEST_Y, 0);
  },

  forwardFromCamera(d) {
    const cam = this.sceneEl.camera.el.object3D;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    return cam.position.clone().add(f.multiplyScalar(d)).setY(CHEST_Y);
  },

  diagonalFromCamera(x, z) {
    const cam = this.sceneEl.camera.el.object3D;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    return cam.position.clone()
      .add(f.multiplyScalar(z))
      .add(r.multiplyScalar(x))
      .setY(CHEST_Y);
  }
});
