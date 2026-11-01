// ================= CONFIGURAÇÕES INICIAIS =================
const BRAWLER_DATA = {
  shelly: { name: 'Shelly', hp: 5000, dmg: 500, emoji: '🥷' },
  colt: { name: 'Colt', hp: 4200, dmg: 400, emoji: '🤠' },
  primo: { name: 'El Primo', hp: 8000, dmg: 800, emoji: '👊' },
  spike: { name: 'Spike', hp: 3600, dmg: 600, emoji: '🌵' },
  corvo: { name: 'Corvo', hp: 3400, dmg: 450, emoji: '🐦' }
};

let currentPlayerData = { trophies: 0, gems: 0, coins: 0, selectedBrawler: 'shelly' };
try {
  const saved = localStorage.getItem('combateRoyale');
  if (saved) currentPlayerData = JSON.parse(saved);
} catch(e) {}

let game = { active: false, player: {}, bots: [], bullets: [], walls: [], bushes: [], clouds: [], boxes: [], cubes: [], timeLeft: 300, kills: 0 };
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
  
  game.active = true; 
  game.bots = []; game.bullets = []; game.clouds = []; game.walls = []; game.bushes = []; game.boxes = []; game.cubes = [];
  game.kills = 0; game.timeLeft = 300; 
  
  const bData = BRAWLER_DATA[currentPlayerData.selectedBrawler];
  game.player = { x: 1000, y: 1000, hp: bData.hp, maxHp: bData.hp, brawler: currentPlayerData.selectedBrawler, shootCooldown: 0, angle: 0 };
  
  document.getElementById('arena').innerHTML = '';
  document.getElementById('hpText').innerText = bData.hp; 
  document.getElementById('hpFill').style.width = '100%'; 
  document.getElementById('hpFill').style.background = '#00ff88';
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
    if (Math.hypot(bx - 1000, by - 1000) < 400) { bx += 500; }
    let b = { id: i, x: bx, y: by, hp: 650, maxHp: 650, speed: 1.2, shootTimer: Math.random() * 60 };
    game.bots.push(b);
    let el = document.createElement('div'); el.className = 'bot'; el.id = 'bot-' + i; el.innerText = '🤖';
    el.style.left = bx + 'px'; el.style.top = by + 'px';
    document.getElementById('arena').appendChild(el);
  }
  
  spawnBoxes();
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

// ================= CAIXAS E CUBOS DE VIDA =================
function spawnBoxes() {
  for (let i = 0; i < 5; i++) {
    let bx = 200 + Math.random() * 1600;
    let by = 200 + Math.random() * 1600;
    game.boxes.push({ id: i, x: bx, y: by, hp: 1000, maxHp: 1000 });
    
    let el = document.createElement('div');
    el.className = 'box';
    el.id = 'box-' + i;
    el.style.left = bx + 'px';
    el.style.top = by + 'px';
    document.getElementById('arena').appendChild(el);
  }
}

function dropCube(x, y) {
  let cube = { x: x, y: y };
  game.cubes.push(cube);
  let el = document.createElement('div');
  el.className = 'cube';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.id = 'cube-' + game.cubes.length;
  document.getElementById('arena').appendChild(el);
}

// ================= NUVEM TÓXICA =================
function spawnCloud() {
  let cx = Math.random() * 2000;
  let cy = Math.random() * 2000;
  let r = 150 + Math.random() * 100;
  let cloud = { x: cx, y: cy, r: r };
  game.clouds.push(cloud);
  
  let el = document.createElement('div');
  el.className = 'cloud';
  el.style.left = (cx - r) + 'px';
  el.style.top = (cy - r) + 'px';
  el.style.width = (r * 2) + 'px';
  el.style.height = (r * 2) + 'px';
  el.id = 'cloud-' + game.clouds.length;
  document.getElementById('arena').appendChild(el);
}

// ================= CONTROLES DE TOQUE =================
function setupTouchControls() {
  const zone = document.getElementById('joystickZone');
  
  const handleMove = (clientX, clientY) => {
    if (!game.active) return;
    const rect = document.getElementById('arena').getBoundingClientRect();
    let tx = clientX - rect.left;
    let ty = clientY - rect.top;
    moveTarget = { x: tx, y: ty };
    
    let dist = Math.hypot(tx - (game.player.x + 20), ty - (game.player.y + 20));
    if (dist > 60) {
      shootBullet(game.player.x + 20, game.player.y + 20, Math.atan2(ty - game.player.y, tx - game.player.x), 'player');
    }
  };

  zone.addEventListener('touchstart', e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
  zone.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
  
  zone.addEventListener('mousedown', e => handleMove(e.clientX, e.clientY));
  zone.addEventListener('mousemove', e => { if(e.buttons === 1) handleMove(e.clientX, e.clientY); });
  
  const fireBtn = document.getElementById('fireBtn');
  fireBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if(game.active) shootBullet(game.player.x + 20, game.player.y + 20, game.player.angle || 0, 'player');
  }, {passive: false});
  fireBtn.addEventListener('mousedown', e => {
    if(game.active) shootBullet(game.player.x + 20, game.player.y + 20, game.player.angle || 0, 'player');
  });
}

// ================= TIROS =================
function shootBullet(x, y, angle, owner) {
  if (owner === 'player' && game.player.shootCooldown > 0) return;
  if (owner === 'player') game.player.shootCooldown = 15;
  
  const speed = 12;
  let dmg = owner === 'player' ? BRAWLER_DATA[game.player.brawler].dmg : 550;
  
  let b = { x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, owner: owner, dmg: dmg, life: 60 };
  game.bullets.push(b);
  
  let el = document.createElement('div');
  el.className = 'bullet';
  el.style.left = (x - 7) + 'px';
  el.style.top = (y - 7) + 'px';
  if (owner === 'bot') el.style.background = '#ff4444';
  document.getElementById('arena').appendChild(el);
  b.el = el;
}

// ================= O LOOP DO JOGO =================
function loop() {
  if (!game.active) return;
  
  // 1. Movimentação do Player
  if (moveTarget) {
    let dx = moveTarget.x - (game.player.x + 20);
    let dy = moveTarget.y - (game.player.y + 20);
    let dist = Math.hypot(dx, dy);
    if (dist > 10) {
      game.player.x += (dx / dist) * 4;
      game.player.y += (dy / dist) * 4;
      game.player.angle = Math.atan2(dy, dx);
    } else { moveTarget = null; }
  }
  
  if (game.player.shootCooldown > 0) game.player.shootCooldown--;
  document.getElementById('playerEl').style.left = game.player.x + 'px';
  document.getElementById('playerEl').style.top = game.player.y + 'px';
  
  // 2. Bots
  for (let b of game.bots) {
    let dx = game.player.x - b.x;
    let dy = game.player.y - b.y;
    let dist = Math.hypot(dx, dy);
    
    if (dist > 40) {
      b.x += (dx / dist) * b.speed;
      b.y += (dy / dist) * b.speed;
    }
    
    document.getElementById('bot-' + b.id).style.left = b.x + 'px';
    document.getElementById('bot-' + b.id).style.top = b.y + 'px';
    
    b.shootTimer--;
    if (b.shootTimer <= 0 && dist < 500) {
      b.shootTimer = 60 + Math.random() * 40;
      shootBullet(b.x + 20, b.y + 20, Math.atan2(dy, dx), 'bot');
    }
    
    if (dist < 35) {
      game.player.hp -= 200;
      b.x -= (dx / dist) * 10;
      b.y -= (dy / dist) * 10;
    }
  }
  
  // 3. Nuvem Tóxica
  for (let c of game.clouds) {
    let dist = Math.hypot(game.player.x - c.x, game.player.y - c.y);
    if (dist < c.r) {
      game.player.hp -= 3;
    }
  }
  
  // 4. Balas
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    let b = game.bullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    b.el.style.left = (b.x - 7) + 'px';
    b.el.style.top = (b.y - 7) + 'px';
    
    let hit = false;
    
    if (b.owner === 'player') {
      for (let j = game.bots.length - 1; j >= 0; j--) {
        let bot = game.bots[j];
        if (Math.hypot(b.x - (bot.x+20), b.y - (bot.y+20)) < 30) {
          bot.hp -= b.dmg;
          if (bot.hp <= 0) {
            document.getElementById('bot-' + bot.id).remove();
            game.bots.splice(j, 1);
            game.kills++;
            currentPlayerData.gems += 10;
            document.getElementById('killCount').innerText = game.kills;
            if (game.kills >= 9) endGame('win');
          }
          hit = true; break;
        }
      }
      if (!hit) {
        for (let k = game.boxes.length - 1; k >= 0; k--) {
          let box = game.boxes[k];
          if (Math.hypot(b.x - (box.x+20), b.y - (box.y+20)) < 30) {
            box.hp -= b.dmg;
            if (box.hp <= 0) {
              document.getElementById('box-' + box.id).remove();
              dropCube(box.x, box.y);
              game.boxes.splice(k, 1);
            }
            hit = true; break;
          }
        }
      }
    } else {
      if (Math.hypot(b.x - (game.player.x+20), b.y - (game.player.y+20)) < 30) {
        game.player.hp -= b.dmg;
        hit = true;
      }
    }
    
    if (hit || b.life <= 0) {
      b.el.remove();
      game.bullets.splice(i, 1);
    }
  }
  
  // 5. Cubos de vida
  for (let i = game.cubes.length - 1; i >= 0; i--) {
    let c = game.cubes[i];
    if (Math.hypot(c.x - game.player.x, c.y - game.player.y) < 35) {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 500);
      let cubeEl = document.getElementById('cube-' + (i+1));
      if(cubeEl) cubeEl.remove();
      game.cubes.splice(i, 1);
    }
  }
  
  // UI de Vida
  if (game.player.hp <= 0) { game.player.hp = 0; endGame('lose'); return; }
  document.getElementById('hpText').innerText = Math.floor(game.player.hp);
  document.getElementById('hpFill').style.width = (game.player.hp / game.player.maxHp * 100) + '%';
  if (game.player.hp / game.player.maxHp < 0.3) document.getElementById('hpFill').style.background = '#ff3333';
  else document.getElementById('hpFill').style.background = '#00ff88';
  
  animFrame = requestAnimationFrame(loop);
}

// ================= FIM DE JOGO =================
function endGame(result) {
  game.active = false;
  cancelAnimationFrame(animFrame);
  clearInterval(timerInterval);
  clearInterval(cloudInterval);
  
  let title = result === 'win' ? '🏆 VITÓRIA!' : (result === 'draw' ? '🤝 EMPATE' : '💀 DERROTA');
  let msg = '';
  
  if (result === 'win') {
    currentPlayerData.trophies += 1000;
    msg = '+1000 Troféus';
  } else {
    msg = 'Sem troféus desta vez.';
  }
  
  localStorage.setItem('combateRoyale', JSON.stringify(currentPlayerData));
  updateUI();
  
  document.getElementById('endTitle').innerText = title;
  document.getElementById('endStats').innerHTML = `
    <div style="color:#00ff88; font-size:18px;">Bots Eliminados: ${game.kills}/9</div>
    <div style="color:#ffcc00; font-size:16px; margin-top:5px;">${msg}</div>
  `;
  openModal('endModal');
}

// ================= SISTEMA DE AUTENTICAÇÃO BÁSICA (LOCAL) =================
// Como ainda não configuramos o Firebase real, isto apenas fecha o modal de login
function toggleAuth() {
  const title = document.getElementById('authTitle');
  if (title.innerText === 'Entrar') {
    title.innerText = 'Criar Conta';
    document.getElementById('authBtn').innerText = 'Registar';
    document.getElementById('authSwitch').innerText = 'Já tenho conta';
  } else {
    title.innerText = 'Entrar';
    document.getElementById('authBtn').innerText = 'Entrar';
    document.getElementById('authSwitch').innerText = 'Criar nova conta';
  }
}

function handleAuth() {
  closeModal('authModal');
  showToast('Login efetuado!');
                           }
