AFRAME.registerSystem("path-manager", {
  init() {
    this.root = document.querySelector("#experienceRoot");
    this.played = new Set();
    this.active = new Map();
    this.startPosition = new THREE.Vector3(0, 1, 0);

    this.spawnInitialDirections();
  },

  spawnInitialDirections() {
    this.clearAll();

    this.spawnNode("front_1", this.forward(1), "#ffffff");
    this.spawnNode("back_1", this.forward(-1), "#000000");
    this.spawnNode("left_1", this.right(-1), "#ff0000");
    this.spawnNode("right_1", this.right(1), "#0066ff");
  },

  clearAll() {
    this.root.innerHTML = "";
    this.active.clear();
  },

  spawnNode(id, pos, color, next = []) {
    if (this.active.has(id)) return;

    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("radius", "0.3");
    sphere.setAttribute("color", color);
    sphere.setAttribute("position", pos);
    sphere.setAttribute("path-node", { id, next });

    this.root.appendChild(sphere);
    this.active.set(id, sphere);
  },

  completeNode(id, nextIds, origin) {
    this.played.add(id);
    this.active.delete(id);

    nextIds.forEach(n => {
      const def = PATH_GRAPH[n];
      if (!def) return;

      const pos = this.computePosition(origin, def.offset);
      this.spawnNode(n, pos, def.color, def.next);
    });
  },

  computePosition(origin, offset) {
    const cam = this.sceneEl.camera.el.object3D;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);

    const p = new THREE.Vector3().copy(origin);
    p.add(f.multiplyScalar(offset.forward || 0));
    p.add(r.multiplyScalar(offset.right || 0));

    return p;
  },

  forward(m) {
    return { x: 0, y: 1, z: -m };
  },

  right(m) {
    return { x: m, y: 1, z: 0 };
  }
});
