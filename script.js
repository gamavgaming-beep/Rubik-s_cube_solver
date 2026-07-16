const COLORS = {
  U:'#f5f6f7',
  R:'#ffde3b',
  F:'#21d15b',
  D:'#ffd08a',
  L:'#295bff',
  B:'#ff5b42'
};

const FACE_ORDER = ['U','R','F','D','L','B'];

const cubeEl = document.getElementById('cube');
const facesEl = document.getElementById('faces');
const legendEl = document.getElementById('legend');
const moveStrip = document.getElementById('moveStrip');
const moveInput = document.getElementById('moveInput');

const modeText = document.getElementById('modeText');
const stepText = document.getElementById('stepText');
const totalText = document.getElementById('totalText');
const progressBar = document.getElementById('progressBar');

const demoBtn = document.getElementById('demoBtn');
const resetBtn = document.getElementById('resetBtn');
const solveBtn = document.getElementById('solveBtn');
const useMovesBtn = document.getElementById('useMovesBtn');
const scrambleBtn = document.getElementById('scrambleBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const autoBtn = document.getElementById('autoBtn');

let cube = newSolvedCube();
let stickers = {};
let history = [];
let currentStep = 0;
let playing = false;
let autoTimer = null;

function newSolvedCube(){
  return {
    U:Array(9).fill('U'),
    R:Array(9).fill('R'),
    F:Array(9).fill('F'),
    D:Array(9).fill('D'),
    L:Array(9).fill('L'),
    B:Array(9).fill('B')
  };
}

function cloneCube(src){
  return {
    U:src.U.slice(),
    R:src.R.slice(),
    F:src.F.slice(),
    D:src.D.slice(),
    L:src.L.slice(),
    B:src.B.slice()
  };
}

function rotateFace(arr, prime){
  const a = arr.slice();
  if(!prime){
    return [a[6],a[3],a[0],a[7],a[4],a[1],a[8],a[5],a[2]];
  }
  return [a[2],a[5],a[8],a[1],a[4],a[7],a[0],a[3],a[6]];
}

function getRow(face, row){
  const i = row * 3;
  return cube[face].slice(i, i + 3);
}

function setRow(face, row, vals){
  const i = row * 3;
  vals.forEach((v, idx) => cube[face][i + idx] = v);
}

function getCol(face, col){
  return [cube[face][col], cube[face][col + 3], cube[face][col + 6]];
}

function setCol(face, col, vals){
  [0,1,2].forEach(i => cube[face][col + i*3] = vals[i]);
}

function turn(face, prime=false){
  if(face === 'R'){
    cube.R = rotateFace(cube.R, prime);
    const u = getCol('U',2);
    const f = getCol('F',2);
    const d = getCol('D',2);
    const b = getCol('B',0).reverse();
    if(!prime){
      setCol('F',2,u);
      setCol('D',2,f);
      setCol('B',0,d.reverse());
      setCol('U',2,b);
    }else{
      setCol('B',0,u.reverse());
      setCol('D',2,b.reverse());
      setCol('F',2,d);
      setCol('U',2,f);
    }
  }

  if(face === 'L'){
    cube.L = rotateFace(cube.L, prime);
    const u = getCol('U',0);
    const f = getCol('F',0);
    const d = getCol('D',0);
    const b = getCol('B',2).reverse();
    if(!prime){
      setCol('B',2,u.reverse());
      setCol('D',0,b.reverse());
      setCol('F',0,d);
      setCol('U',0,f);
    }else{
      setCol('F',0,u);
      setCol('D',0,f);
      setCol('B',2,d.reverse());
      setCol('U',0,b);
    }
  }

  if(face === 'U'){
    cube.U = rotateFace(cube.U, prime);
    const f = getRow('F',0);
    const r = getRow('R',0);
    const b = getRow('B',0);
    const l = getRow('L',0);
    if(!prime){
      setRow('R',0,f);
      setRow('B',0,r);
      setRow('L',0,b);
      setRow('F',0,l);
    }else{
      setRow('L',0,f);
      setRow('B',0,l);
      setRow('R',0,b);
      setRow('F',0,r);
    }
  }

  if(face === 'D'){
    cube.D = rotateFace(cube.D, prime);
    const f = getRow('F',2);
    const r = getRow('R',2);
    const b = getRow('B',2);
    const l = getRow('L',2);
    if(!prime){
      setRow('L',2,f);
      setRow('B',2,l);
      setRow('R',2,b);
      setRow('F',2,r);
    }else{
      setRow('R',2,f);
      setRow('B',2,r);
      setRow('L',2,b);
      setRow('F',2,l);
    }
  }

  if(face === 'F'){
    cube.F = rotateFace(cube.F, prime);
    const u = getRow('U',2);
    const r = getCol('R',0);
    const d = getRow('D',0);
    const l = getCol('L',2);
    if(!prime){
      setCol('R',0,u.slice().reverse());
      setRow('D',0,r);
      setCol('L',2,d.slice().reverse());
      setRow('U',2,l);
    }else{
      setCol('L',2,u);
      setRow('D',0,l.slice().reverse());
      setCol('R',0,d);
      setRow('U',2,r.slice().reverse());
    }
  }

  if(face === 'B'){
    cube.B = rotateFace(cube.B, prime);
    const u = getRow('U',0);
    const r = getCol('R',2);
    const d = getRow('D',2);
    const l = getCol('L',0);
    if(!prime){
      setCol('L',0,u.slice().reverse());
      setRow('D',2,l);
      setCol('R',2,d.slice().reverse());
      setRow('U',0,r);
    }else{
      setCol('R',2,u);
      setRow('D',2,r.slice().reverse());
      setCol('L',0,d);
      setRow('U',0,l.slice().reverse());
    }
  }
}

function buildLegend(){
  legendEl.innerHTML = '';
  for(const [face,color] of Object.entries(COLORS)){
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="dot" style="background:${color}"></span><span>${face}</span>`;
    legendEl.appendChild(item);
  }
}

function buildEditor(){
  facesEl.innerHTML = '';
  FACE_ORDER.forEach(face => {
    const wrap = document.createElement('div');
    wrap.className = 'face-wrap';
    wrap.innerHTML = `<div class="face-title"><span>${face}</span><span>9 stickers</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'face-grid';

    stickers[face] = [];

    for(let i=0;i<9;i++){
      const s = document.createElement('div');
      s.className = 'sticker';
      s.dataset.face = face;
      s.dataset.idx = i;
      s.addEventListener('click', () => cycleSticker(face, i, s));
      stickers[face].push(s);
      grid.appendChild(s);
    }

    wrap.appendChild(grid);
    facesEl.appendChild(wrap);
  });

  syncEditor();
}

function cycleSticker(face, idx, el){
  const keys = Object.keys(COLORS);
  const cur = cube[face][idx];
  const next = keys[(keys.indexOf(cur) + 1) % keys.length];
  cube[face][idx] = next;
  el.style.background = COLORS[next];
}

function syncEditor(){
  FACE_ORDER.forEach(face => {
    cube[face].forEach((c, i) => {
      stickers[face][i].style.background = COLORS[c];
    });
  });
}

function renderCube3D(){
  cubeEl.innerHTML = '';
  FACE_ORDER.forEach(face => {
    const faceEl = document.createElement('div');
    faceEl.className = `face3d ${face}`;
    cube[face].forEach(c => {
      const sq = document.createElement('div');
      sq.className = 'sq';
      sq.style.background = COLORS[c];
      faceEl.appendChild(sq);
    });
    cubeEl.appendChild(faceEl);
  });
}

function parseMoves(input){
  const tokens = input.trim().split(/s+/).filter(Boolean);
  const out = [];
  for(const t of tokens){
    const m = t.match(/^([URFDLB])('?)(2?)$/i);
    if(!m) continue;
    out.push({
      face: m[1].toUpperCase(),
      prime: m[2] === "'",
      dbl: m[3] === '2',
      raw: t
    });
  }
  return out;
}

function expandMoves(list){
  const out = [];
  for(const m of list){
    if(m.dbl){
      out.push({face:m.face, prime:false, raw:m.raw});
      out.push({face:m.face, prime:false, raw:m.raw});
    }else{
      out.push(m);
    }
  }
  return out;
}

function showMoveStrip(list){
  moveStrip.innerHTML = '';
  list.forEach((m, i) => {
    const chip = document.createElement('div');
    chip.className = 'move-chip';
    chip.textContent = m.raw;
    chip.id = `move-${i}`;
    moveStrip.appendChild(chip);
  });
}

function refreshProgress(){
  totalText.textContent = history.length;
  stepText.textContent = currentStep;
  const pct = history.length ? (currentStep / history.length) * 100 : 0;
  progressBar.style.width = `${pct}%`;
  [...moveStrip.children].forEach((el, i) => {
    el.classList.toggle('active', i === currentStep);
  });
}

function setMode(text){
  modeText.textContent = text;
}

function stopAuto(){
  if(autoTimer){
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function wait(ms){
  return new Promise(res => setTimeout(res, ms));
}

async function animateMove(move){
  playing = true;
  setMode('Animating');
  const face = move.face;
  const prime = move.prime;
  const baseY = 38;
  const targetY = baseY + (prime ? -90 : 90);
  const start = performance.now();
  const duration = 260;

  return new Promise(resolve => {
    function frame(now){
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const currentY = baseY + (targetY - baseY) * ease;
      cubeEl.style.transform = `rotateX(-28deg) rotateY(${currentY}deg)`;
      if(t < 1){
        requestAnimationFrame(frame);
      }else{
        turn(face, prime);
        renderCube3D();
        cubeEl.style.transform = 'rotateX(-28deg) rotateY(38deg)';
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

async function nextStep(){
  if(playing || currentStep >= history.length) return;
  const move = history[currentStep];
  currentStep++;
  refreshProgress();
  await animateMove(move);
  refreshProgress();
  setMode(currentStep >= history.length ? 'Done' : 'Ready');
}

async function prevStep(){
  if(playing || currentStep <= 0) return;

  stopAuto();
  const target = currentStep - 1;
  resetCubeOnly();
  for(let i=0;i<target;i++){
    const m = history[i];
    turn(m.face, m.prime);
  }
  currentStep = target;
  renderCube3D();
  syncEditor();
  refreshProgress();
  setMode('Ready');
}

function resetCubeOnly(){
  cube = newSolvedCube();
  renderCube3D();
  syncEditor();
}

function resetAll(){
  stopAuto();
  cube = newSolvedCube();
  history = [];
  currentStep = 0;
  playing = false;
  moveInput.value = '';
  showMoveStrip([]);
  renderCube3D();
  syncEditor();
  setMode('Ready');
  refreshProgress();
}

function useInputMoves(){
  const parsed = parseMoves(moveInput.value);
  history = expandMoves(parsed);
  currentStep = 0;
  showMoveStrip(history);
  refreshProgress();
  setMode('Moves loaded');
}

function scrambleDemo(){
  const faces = ['U','R','F','D','L','B'];
  const suffix = ['', "'", '2'];
  const arr = [];
  let prev = '';
  for(let i=0;i<20;i++){
    let f = faces[(Math.random()*6)|0];
    while(f === prev) f = faces[(Math.random()*6)|0];
    prev = f;
    arr.push(f + suffix[(Math.random()*3)|0]);
  }
  moveInput.value = arr.join(' ');
  useInputMoves();
}

function demoSolution(){
  moveInput.value = "R U R' U' F2 L D' B2";
  useInputMoves();
  setMode('Demo loaded');
}

async function autoPlay(){
  if(playing) return;
  stopAuto();
  autoTimer = setInterval(async () => {
    if(playing) return;
    if(currentStep >= history.length){
      stopAuto();
      return;
    }
    await nextStep();
  }, 500);
}

demoBtn.addEventListener('click', demoSolution);
resetBtn.addEventListener('click', resetAll);
solveBtn.addEventListener('click', useInputMoves);
useMovesBtn.addEventListener('click', useInputMoves);
scrambleBtn.addEventListener('click', scrambleDemo);
prevBtn.addEventListener('click', prevStep);
nextBtn.addEventListener('click', nextStep);
autoBtn.addEventListener('click', autoPlay);

buildLegend();
buildEditor();
resetAll();
