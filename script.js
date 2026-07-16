/* Simple demo: builds a flat 2D net editor and a 2D preview that animates moves frame-by-frame.
   This is intentionally compact so you can paste to GitHub Pages quickly.
*/

const faceOrder = ['U','L','F','R','B','D'];
const colors = {U:'#fff',L:'#ffcc00',F:'#ff0000',R:'#00cc00',B:'#0022cc',D:'#ffcc66'};

function mkSticker(color){ const s=document.createElement('div'); s.className='sticker'; s.style.background=color; return s; }

function buildEditor(){
  const facesWrap = document.getElementById('faces');
  faceOrder.forEach(f=>{
    const faceDiv = document.createElement('div');
    faceDiv.className='face';
    faceDiv.dataset.face=f;
    for(let i=0;i<9;i++){
      const st = mkSticker(colors[f]);
      st.dataset.idx=i;
      st.addEventListener('click', ()=> {
        // cycle color for demo
        const pal = Object.values(colors);
        const cur = st.style.backgroundColor;
        let next = pal[(pal.indexOf(rgbToHex(cur)) +1) % pal.length];
        st.style.background = next;
      });
      faceDiv.appendChild(st);
    }
    facesWrap.appendChild(faceDiv);
  });
}

// helper to normalize rgb to hex quick
function rgbToHex(rgb){
  if(!rgb) return rgb;
  if(rgb[0]==='#') return rgb;
  const m = rgb.match(/(d+),s*(d+),s*(d+)/);
  if(!m) return rgb;
  return '#'+[1,2,3].map(i=>parseInt(m[i]).toString(16).padStart(2,'0')).join('');
}

buildEditor();

document.getElementById('solveBtn').addEventListener('click', ()=>{
  // demo move sequence (not a real solver). Each move is {face:'R',dir:1} meaning clockwise.
  const moves = [{face:'R',dir:1},{face:'U',dir:-1},{face:'F',dir:1},{face:'R',dir:1},{face:'U',dir:1}];
  animateMoves(moves);
});

function animateMoves(moves){
  const log = document.getElementById('log');
  log.textContent = 'Animating '+moves.length+' moves...';
  let i=0;
  function next(){
    if(i>=moves.length){ log.textContent='Done'; return;}
    animateSingle(moves[i], ()=>{ i++; setTimeout(next,300); });
  }
  next();
}

function animateSingle(move, cb){
  const preview = document.getElementById('preview2d');
  // create overlay element to show rotation visually
  const overlay = document.createElement('div');
  overlay.style.position='absolute';
  overlay.style.left = preview.getBoundingClientRect().left + 'px';
  overlay.style.top = preview.getBoundingClientRect().top + 'px';
  overlay.style.width = preview.offsetWidth+'px';
  overlay.style.height = preview.offsetHeight+'px';
  overlay.style.pointerEvents='none';
  overlay.style.display='flex';
  overlay.style.alignItems='center';
  overlay.style.justifyContent='center';
  overlay.style.backdropFilter='blur(0px)';
  overlay.style.transition='transform 320ms linear';
  overlay.style.transformOrigin='center';
  overlay.style.zIndex=999;
  document.body.appendChild(overlay);

  // rotate a fake cube face indicator
  overlay.textContent = move.face + (move.dir===1? " ↻":" ↺");
  overlay.style.fontSize='48px';
  overlay.style.opacity='0.95';
  overlay.style.background='rgba(255,255,255,0.4)';
  overlay.style.borderRadius='10px';
  // animate
  requestAnimationFrame(()=>{
    overlay.style.transform = 'rotateY(' + (move.dir*90) + 'deg)';
    setTimeout(()=>{
      overlay.style.transform = 'rotateY(0deg)';
      setTimeout(()=>{
        document.body.removeChild(overlay);
        cb();
      },280);
    },320);
  });
}
