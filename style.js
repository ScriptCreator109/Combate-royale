let game = { active: false, player: {}, bots: [], bullets: [], walls: [], bushes: [], clouds: [], timeLeft: 300, kills: 0 };
let moveTarget = null, animFrame = null, timerInterval = null, cloudInterval = null;

function startSolo() {
  closeModal('eventsModal');
  document.getElementById('menuScreen').classList.add('hide');
  document.getElementById('gameScreen').classList.add('active');
  
  game.active = true; game.bots = []; game.bullets = []; game.clouds = []; game.kills = 0; game.timeLeft = 300; game.walls = []; game.bushes = [];
  
  const bData = BRAWLER_DATA[currentPlayerData.selectedBrawler];
  game.player = { x: 1000, y: 1000, hp: bData.hp, maxHp: bData.hp, brawler: currentPlayerData.selectedBrawler };
  
  document.getElementById('arena').innerHTML = '';
  document.getElementById('hpText').innerText = bData.hp; document.getElementById('hpFill').style.width = '100%'; document.getElementById('killCount').innerText = '0';
  
  // Criar Mapa
  for (let i = 0; i < 12; i++) {
    let x = Math.random() * 2000, y = Math.random() * 2000, w = 100, h = 100;
    if (Math.hypot(x - 1000, y - 1000) > 300) {
      game.walls.push({x,y,w,h});
      let el = document.createElement('div'); el.className = 'wall'; el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      document.getElementById('arena').appendChild(el);
    }
  }
  for (let i = 0; i < 15; i++) {
    let x = Math.random() * 2000, y = Math.random() * 2000, r = 50;
    game.bushes.push({x,y,r});
    let el = document.createElement('div'); el.className = 'bush'; el.style.cssText = `left:${x-r}px;top:${y-r}px;width:${r*2}px;height:${r*2}px`;
    document.getElementById('arena').appendChild(el);
  }
  
  // Player
  let pEl = document.createElement('div'); pEl.className = 'player'; pEl.id = 'playerEl'; pEl.innerText = bData.emoji;
  pEl.style.left = game.player.x + 'px'; pEl.style.top = game.player.y + 'px';
  document.getElementById('arena').appendChild(pEl);
  
  // Bots (9 bots de 650hp)
  for (let i = 0; i < 9; i++) {
    let bx = 100 + Math.random() * 1800, by = 100 + Math.random() * 1800;
    if (Math.hypot(bx - 1000, by - 1000) < 300) { bx += 500; }
    let b = { id: i, x: bx, y: by, hp: 650, maxHp: 650, speed: 1.2, shootTimer: Math.random() * 60 };
    game.bots.push(b);
    let el = document.createElement('div'); el.className = 'bot'; el.id = 'bot-' + i; el.innerText = '🤖';
    el.style.left = bx + 'px'; el.style.top = by + 'px';
    document.getElementById('arena').appendChild(el);
  }
  
  setupTouchControls();
  if(animFrame) cancelAnimationFrame(animFrame);
  loop();
  
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!game.active) return;
    game.timeLeft--;
    document.getElementById('timerDisplay').innerText = `${Math.floor(game.timeLeft/60).toString().padStart(2,'0')}:${(game.timeLeft%60).toString().padStart(2,'0')}`;
    if (game.timeLeft <= 0) endGame('draw');
  }, 1000);
  
  if(cloudInterval) clearInterval(cloudInterval);
  cloudInterval = setInterval(() => { if(game.active) spawnCloud(); }, 3000);
}

function setupTouchControls() {
  const zone = document.getElementById('joystickZone');
  zone.ontouchstart = (e) => { e.preventDefault(); updateTarget(e.touches[0]); };
  zone.ontouchmove = (e) => { e.preventDefault(); updateTarget(e.touches[0]); };
  zone.onmousedown = (e) => { updateTarget(e); };
  zone.onmousemove = (e) => { if(e.buttons === 1) updateTarget(e); };
}

function updateTarget(e) {
  const rect = document.getElementById('arena').getBoundingClientRect();
  let tx = e.clientX - rect.left;
  let ty = e.clientY - rect.top;
  moveTarget = { x: tx, y: ty };
  
  // Atirar ao
