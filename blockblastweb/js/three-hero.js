/* ============================================================
   Hero scene — a loose grid of floating blocks.

   Decorative only: aria-hidden, no raycasting, and the hero text is
   fully readable with the canvas removed. Three.js itself is fetched
   with a dynamic import that only fires once the hero is on screen and
   the browser is idle, so ~1 MB of library never competes with first
   paint. The scene is disposed on navigation.
   ============================================================ */

const container = document.getElementById('hero-canvas');

if (container) {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The game's own block palette. */
  const PALETTE = [0xED424F, 0x3882F5, 0x33BA5C, 0xFACC26, 0x9954E6, 0xFA8729, 0x29C9D9];

  /* A loose 8×8 arrangement: twelve of the sixty-four cells, chosen so the
     silhouette reads as a puzzle board rather than a random scatter. */
  const CELLS = [
    [0, 1], [2, 0], [1, 3], [3, 2], [5, 1], [4, 4],
    [6, 3], [2, 5], [5, 6], [7, 5], [3, 7], [6, 7]
  ];

  let THREE, renderer, scene, camera, group, clock;
  let frame = null, observer = null, started = false, disposed = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function build() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    clock = new THREE.Clock();
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    /* Lighting: a soft ambient fill, one key light that casts, and a coral rim
       that ties the scene to the brand without tinting the whole palette. */
    scene.add(new THREE.AmbientLight(0xBFC8FF, 1.6));
    const key = new THREE.DirectionalLight(0xFFFFFF, 2.6);
    key.position.set(5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xE94560, 0.55);
    rim.position.set(-6, -3, 4);
    scene.add(rim);

    group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const spacing = 1.75;
    const half = (8 - 1) / 2;

    CELLS.forEach(([col, row], index) => {
      const material = new THREE.MeshStandardMaterial({
        color: PALETTE[index % PALETTE.length],
        roughness: 0.34,
        metalness: 0.04
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.position.set(
        (col - half) * spacing,
        (half - row) * spacing * 0.62,
        (index % 3) * -1.1
      );
      cube.rotation.set(0.2 + index * 0.05, 0.35 + index * 0.08, 0);
      cube.scale.setScalar(0.86 + (index % 4) * 0.07);
      cube.userData.phase = index * 0.7;
      cube.userData.baseY = cube.position.y;
      group.add(cube);
    });

    /* A transparent plane that only catches shadow, so the blocks feel grounded
       without introducing a visible floor over the page background. */
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.35 })
    );
    shadowPlane.position.z = -7;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    group.rotation.set(-0.08, -0.25, 0);
    renderer.render(scene, camera);
  }

  function tick() {
    frame = requestAnimationFrame(tick);
    const time = clock.getElapsedTime();

    group.rotation.y += 0.001;

    group.children.forEach((cube) => {
      cube.position.y = cube.userData.baseY + Math.sin(time * 0.6 + cube.userData.phase) * 0.28;
      cube.rotation.x += 0.0012;
      cube.rotation.y += 0.0018;
    });

    /* Pointer tilt, eased toward the target so it never snaps. Capped at 5°. */
    const MAX = THREE.MathUtils.degToRad(5);
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    group.rotation.x = -0.08 + pointer.y * MAX;
    group.rotation.z = pointer.x * MAX * 0.4;

    renderer.render(scene, camera);
  }

  function onPointerMove(event) {
    const touch = event.touches ? event.touches[0] : event;
    pointer.tx = (touch.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (touch.clientY / window.innerHeight) * 2 - 1;
  }

  function onResize() {
    if (!renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (reduced) renderer.render(scene, camera);
  }

  function start() {
    if (frame || reduced || disposed || !renderer) return;
    clock.start();
    tick();
  }

  function stop() {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = null;
  }

  function dispose() {
    disposed = true;
    stop();
    if (observer) observer.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onPointerMove);
    if (!scene) return;
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        (Array.isArray(object.material) ? object.material : [object.material])
          .forEach((material) => material.dispose());
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    renderer = scene = camera = group = null;
  }

  /* ---------- Lazy boot ---------- */
  async function boot() {
    if (started || disposed) return;
    started = true;
    try {
      THREE = await import(THREE_URL);
      if (disposed) return;
      build();
      window.addEventListener('resize', onResize);

      if (!reduced) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        document.addEventListener('visibilitychange', () => {
          document.hidden ? stop() : start();
        });
        start();
      }
    } catch (error) {
      /* No WebGL, no network, no module — the hero text loses nothing. */
      container.remove();
    } finally {
      document.dispatchEvent(new CustomEvent('bb:scene-ready'));
    }
  }

  const whenIdle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };

  /* Load the library only when the hero is actually on screen, and only once
     the browser has a spare moment. Below the fold, it is never fetched. */
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !started) whenIdle(boot, { timeout: 1500 });
      else if (started) visible ? start() : stop();
    }, { threshold: 0.01 });
    observer.observe(container);
  } else {
    whenIdle(boot);
  }

  window.addEventListener('pagehide', dispose, { once: true });
}
