// ================= CONFIGURAÇÕES INICIAIS =================
const BRAWLER_DATA = {
  shelly: { name: 'Shelly', hp: 5000, dmg: 500, emoji: '🥷' },
  colt: { name: 'Colt', hp: 4200, dmg: 400, emoji: '🤠' },
  primo: { name: 'El Primo', hp: 8000, dmg: 800, emoji: '🤼' },
  spike: { name: 'Spike', hp: 3600, dmg: 600, emoji: '🌵' },
  corvo: { name: 'Corvo', hp: 3400, dmg: 450, emoji: '🐦' }
};

let currentPlayerData = { trophies: 0, gems: 0, coins: 0, selectedBrawler: 'shelly' };
try {
  const saved = localStorage.getItem('combateRoyale');
  if (saved) currentPlayerData = JSON.parse(saved);
} catch(e) {}

let game = { active: false, player: {}, bots: [], bullets: [], walls: [], bushes: [], clouds: [], timeLeft: 300, kills: 0 };
let moveTarget = null, animFrame = null, timerInterval = null, cloudInterval = null;

// ================= FUNÇÕES DE UI =================
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
function returnToMenu() { 
  document.getElementById('menuScreen').classList.remove('hide'); 
  document.getElementById('gameScreen').classList.remove('active'); 
  game.active = false; 
  if(animFrame) cancelAnimationFrame(animFrame); 
  if(timerInterval) clearInterval(timerInterval); 
}

function updateUI() {
  if (!document.getElementById('menuTrophies')) return;
  document.getElementById('menuTrophies').innerText = currentPlayerData.trophies;
  document.getElementById('menuGems').innerText = currentPlayerData.gems;
  document.getElementById('menuCoins').innerText = currentPlayerData.coins;
  document.getElementById('menuBrawlerName').innerText = currentPlayerData.selectedBrawler.toUpperCase();
  document.getElementById('menuBrawlerIcon').innerText = BRAWLER_DATA[currentPlayerData.selectedBrawler].emoji;
}
updateUI();

// ================= LÓGICA DE INÍCIO DE JOGO =================
function startSolo() {
  closeModal('eventsModal');
  document.getElementById('menuScreen').classList.add('hide');
  document.getElementById('gameScreen').classList.add('active');
  
  game.active = true; game.bots = []; game.bullets = []; game.clouds = []; game.kills = 0; game.timeLeft = 300; game.walls = []; game.bushes = [];
  
  const bData = BRAWLER_DATA[currentPlayerData.selectedBrawler];
  game.player = { x: 1000, y: 1000, hp: bData.hp, maxHp: bData.hp, brawler: currentPlayerData.selectedBrawler };
  
  document.getElementById('arena').innerHTML = '';
  document.getElementById('hpText').innerText = bData.hp; 
  document.getElementById('hpFill').style.width = '100%'; 
  document.getElementById('killCount').innerText = '0';
  
  // Criar Paredes
  for (let i = 0; i < 12; i++) {
    let x = Math.random() * 2000, y = Math.random() * 2000, w = 100, h = 100;
    if (Math.hypot(x - 1000, y - 1000) > 300) {
      game.walls.push({x,y,w,h});
      let el = document.createElement('div'); el.className = 'wall'; el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      document.getElementById('arena').appendChild(el);
    }
  }
  
  // Criar Arbustos
  for (let i = 0; i < 15; i++) {
    let x = Math.random() * 2000, y = Math.random() * 2000, r = 50;
    game.bushes.push({x,y,r});
    let el = document.createElement('div'); el.className = 'bush'; el.style.cssText = `left:${x-r}px;top:${y-r}px;width:${r*2}px;height:${r*2}px`;
    document.getElementById('arena').appendChild(el);
  }
  
  // Criar Player
  let pEl = document.createElement('div'); pEl.className = 'player'; pEl.id = 'playerEl'; pEl.innerText = bData.emoji;
  pEl.style.left = game.player.x + 'px'; pEl.style.top = game.player.y + 'px';
  document.getElementById('arena').appendChild(pEl);
  
  // Criar Bots
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
