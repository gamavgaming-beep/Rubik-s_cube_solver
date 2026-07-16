/* =========================================================
   Robust loader (multi-CDN + ESM). Then init().
   ========================================================= */
(function boot(){
  const UMD = [
    "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js",
    "https://fastly.jsdelivr.net/npm/three@0.162.0/build/three.min.js",
    "https://gcore.jsdelivr.net/npm/three@0.162.0/build/three.min.js",
    "https://unpkg.com/three@0.162.0/build/three.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js"
  ];
  const ESM = [
    "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js",
    "https://esm.sh/three@0.162.0",
    "https://ga.jspm.io/npm:three@0.162.0/build/three.module.js"
  ];
  const ready = (fn)=> document.readyState!=="loading" ? fn() : document.addEventListener("DOMContentLoaded", fn, {once:true});
  const load = (src)=> new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.async=true; s.crossOrigin="anonymous"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  async function ensureThree(){
    if (window.THREE) return true;
    for (const u of UMD){ try{ await load(u); if (window.THREE) return true; } catch{} }
    for (const u of ESM){ try{ const m=await import(/* @vite-ignore */u); window.THREE={...m}; if (THREE.Scene) return true; } catch{} }
    const el=document.getElementById("log"); if (el) el.textContent="Add three.min.js in Pen Settings.";
    return false;
  }
  ready(async()=>{ if (await ensureThree()) init(); });
})();

/* =========================================================
   3D Rubik's Cube — stable transforms (no drifting)
   ========================================================= */
function init(){
  const stage = document.getElementById("stage");
  const logEl = document.getElementById("log");
  const btnGen = document.getElementById("btn-generate");
  const btnSolve = document.getElementById("btn-solve");
  const btnReset = document.getElementById("btn-reset");
  const speedSel = document.getElementById("speed");

  // Scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(6.2, 5.4, 7.8);
  camera.lookAt(0,0,0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
  stage.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(4,7,6); scene.add(key);
  const rim = new THREE.PointLight(0x88baff, 0.35); rim.position.set(-6,3,-4); scene.add(rim);

  // Orbit container (do NOT put per-move groups here)
  const world = new THREE.Group(); scene.add(world);

  // Cube root (logical parent for cubies)
  const cubeRoot = new THREE.Group(); world.add(cubeRoot);

  // Visuals
const COLORS = {
  U: 0xffffff, // Up    → White
  D: 0xffd500, // Down  → Yellow
  L: 0xff6b00, // Left  → Orange
  R: 0xcc0000, // Right → Red
  F: 0x28c76f, // Front → Green (brighter for visibility)
  B: 0x2b7fff, // Back  → Blue (distinct from body)
  BODY: 0x0b0f18, // Plastic body (black)
  EDGE: 0x263046   // Edge lines
};
  const cubieSize = 0.96, gap = 1.02, stickerSize = 0.84, stickerLift = 0.02;
  const bodyGeom = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
  const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.BODY, roughness: .7, metalness: .1 });

  const cubelets = []; // { mesh }

  function makeSticker(color){
    const g = new THREE.PlaneGeometry(stickerSize, stickerSize);
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color, roughness:.35, metalness:.05, emissive: color, emissiveIntensity:.18
    }));
  }
  function addStickers(mesh, x,y,z){
    const off = cubieSize/2 + stickerLift;
    if (x===+1){ const s=makeSticker(COLORS.R); s.position.x=+off; s.rotation.y=-Math.PI/2; mesh.add(s); }
    if (x===-1){ const s=makeSticker(COLORS.L); s.position.x=-off; s.rotation.y=+Math.PI/2; mesh.add(s); }
    if (y===+1){ const s=makeSticker(COLORS.U); s.position.y=+off; s.rotation.x=-Math.PI/2; mesh.add(s); }
    if (y===-1){ const s=makeSticker(COLORS.D); s.position.y=-off; s.rotation.x=+Math.PI/2; mesh.add(s); }
    if (z===+1){ const s=makeSticker(COLORS.F); s.position.z=+off; mesh.add(s); }
    if (z===-1){ const s=makeSticker(COLORS.B); s.position.z=-off; s.rotation.y=Math.PI; mesh.add(s); }
  }

  function buildCube(){
    while (cubeRoot.children.length) cubeRoot.remove(cubeRoot.children[0]);
    cubelets.length = 0;
    for (let x=-1; x<=1; x++){
      for (let y=-1; y<=1; y++){
        for (let z=-1; z<=1; z++){
          const body = new THREE.Mesh(bodyGeom, bodyMat.clone());
          body.position.set(x*gap, y*gap, z*gap);
          // edges
          body.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(bodyGeom),
            new THREE.LineBasicMaterial({ color: COLORS.EDGE })
          ));
          addStickers(body, x,y,z);
          cubeRoot.add(body);
          cubelets.push({ mesh: body });
        }
      }
    }
  }
  buildCube();

  /* ---------------- Moves & animation (stable) ---------------- */
  const AXIS = { U:'y', D:'y', L:'x', R:'x', F:'z', B:'z' };
  const LAYER = { U:+1, D:-1, L:-1, R:+1, F:+1, B:-1 };
  const BASE  = { U:-1, D:+1, L:+1, R:-1, F:-1, B:+1 }; // view-from-face clockwise
  const VEC   = { x:new THREE.Vector3(1,0,0), y:new THREE.Vector3(0,1,0), z:new THREE.Vector3(0,0,1) };

  let queue = [], animating = false, lastScramble = [];

  // grid helpers
  const idx = (v)=> Math.round(v / gap);                       // → -1,0,1
  const onLayer = (m, axis, layer)=> idx(m.position[axis]) === layer;

  function selectLayer(axis, layer){
    return cubelets.filter(c => onLayer(c.mesh, axis, layer));
  }

  function moveSpec(tok){
    const f=tok[0], axis=AXIS[f], layer=LAYER[f];
    const mult = tok.endsWith("2") ? 2 : 1;
    const prime = tok.endsWith("'") ? -1 : 1;
    const angle = BASE[f] * prime * (Math.PI/2) * mult;
    return { axis, layer, angle };
  }

  function snapCubie(m){
    // positions snap to exact grid
    m.position.set(idx(m.position.x)*gap, idx(m.position.y)*gap, idx(m.position.z)*gap);
    // rotations snap to quarter turns to kill float error
    const q = Math.PI/2;
    m.rotation.x = Math.round(m.rotation.x / q) * q;
    m.rotation.y = Math.round(m.rotation.y / q) * q;
    m.rotation.z = Math.round(m.rotation.z / q) * q;
  }

  function applyMove(token, duration){
    return new Promise(resolve=>{
      const { axis, layer, angle } = moveSpec(token);
      const parts = selectLayer(axis, layer);
      // temp group sits under cubeRoot (NOT world)
      const g = new THREE.Group(); cubeRoot.add(g);
      parts.forEach(p => g.attach(p.mesh)); // adopt while preserving world xform

      const axisVec = VEC[axis];
      const start = performance.now();
      const baseRot = g.rotation.clone();

      (function anim(now){
        const t = Math.min(1, (now - start) / duration);
        // easeInOutCubic
        const e = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        g.rotation.copy(baseRot);
        g.rotateOnAxis(axisVec, angle * e);
        renderer.render(scene, camera);
        if (t < 1) return requestAnimationFrame(anim);

        // ---- Bake WITHOUT double-matrix! ----
        while (g.children.length){
          const m = g.children[0];
          cubeRoot.attach(m);     // reparent back, preserving world xform
          snapCubie(m);           // snap to grid
        }
        cubeRoot.remove(g);
        resolve();
      })(performance.now());
    });
  }

  async function runQueue(){
    if (animating) return;
    animating = true; disableUI(true);
    let i=0;
    while (queue.length){
      const mv = queue.shift();
      logStep(`${++i}. ${mv}`);
      await applyMove(mv, Number(speedSel.value));
    }
    disableUI(false); animating = false;
  }
  const pushMoves = (toks)=>{ queue.push(...toks); runQueue(); };
  const inverseMoves = (arr)=> arr.slice().reverse().map(t=>t.endsWith("2")?t:(t.endsWith("'")?t.slice(0,-1):t+"'"));

  /* ---------------- Controls ---------------- */
  const FACES = ["U","D","L","R","F","B"];
  const AX_OF = { U:'y', D:'y', L:'x', R:'x', F:'z', B:'z' };
  function randomScramble(n=22){
    const out=[]; let prev=null;
    for (let i=0;i<n;i++){
      let f; do{ f = FACES[(Math.random()*FACES.length)|0]; } while (AX_OF[f]===prev);
      prev = AX_OF[f];
      const suf = Math.random()<0.5 ? "" : (Math.random()<0.5 ? "'" : "2");
      out.push(f+suf);
    }
    return out;
  }
  function resetCube(){ buildCube(); logClear("Reset."); lastScramble=[]; }

  btnGen.addEventListener("click", ()=>{
    if (animating) return;
    const s = randomScramble();
    lastScramble = s.slice();
    logHeader("Scramble"); logLine(s.join(" "));
    pushMoves(s);
  });
  btnSolve.addEventListener("click", ()=>{
    if (animating) return;
    if (!lastScramble.length) return logLine("Nothing to solve. Generate first.");
    const inv = inverseMoves(lastScramble);
    logHeader("Solve"); logLine(inv.join(" "));
    pushMoves(inv);
  });
  btnReset.addEventListener("click", ()=>{ if (!animating) resetCube(); });

  function disableUI(f){ btnGen.disabled=f; btnSolve.disabled=f; btnReset.disabled=f; speedSel.disabled=f; }

  /* ---------------- Resize + orbit ---------------- */
  function fit(){ const w=stage.clientWidth||600, h=stage.clientHeight||600; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  window.addEventListener("resize", fit, {passive:true}); fit();

  let auto=true, dragging=false, last=null;
  stage.addEventListener("pointerdown",(e)=>{ dragging=true; auto=false; last={x:e.clientX,y:e.clientY}; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove",(e)=>{ if(!dragging) return; const dx=e.clientX-last.x, dy=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; world.rotation.y+=dx*0.005; world.rotation.x+=dy*0.003; });
  stage.addEventListener("pointerup",()=>{ dragging=false; setTimeout(()=>auto=true,1200); });

  (function render(){ if (auto && !animating) world.rotation.y += 0.0035; renderer.render(scene,camera); requestAnimationFrame(render); })();

  /* ---------------- Log helpers ---------------- */
  function logClear(msg=""){ logEl.textContent = msg ? msg + "\n" : ""; }
  function logLine(msg){ logEl.textContent += msg + "\n"; logEl.scrollTop = logEl.scrollHeight; }
  function logHeader(t){ logEl.textContent += `\n— ${t} —\n`; }
  function logStep(msg){ logLine(msg); }

  logClear("Ready. Generate → Solve. Drag to orbit. Use Speed for turn rate.");
   }
