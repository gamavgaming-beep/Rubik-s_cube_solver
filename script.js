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
    cube.D = ro
