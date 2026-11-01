let game = { active: false, player: {}, bots: [], bullets: [], walls: [], bushes: [], clouds: [], boxes: [], cubes: [], timeLeft: 300, kills: 0 };
let moveJoystick = { active: false, dx: 0, dy: 0, touchId: null };
let animFrame = null, timerInterval = null, cloudInterval = null;

function openModal(id) { 
  document.getElementById(id).classList.add('active'); 
  if(id === 'brawlersModal') {
    const grid = document.getElementById('brawlersGrid'); grid.innerHTML = '';
    Object.keys(BRAWLER_DATA).forEach(key => {
      const data = BRAWLER_DATA[key]; const owned = currentPlayerData.ownedBrawlers && currentPlayerData.ownedBrawlers[key];
      const item = document.createElement('div'); item.className = 'shop-item';
      if (currentPlayerData.selectedBrawler === key) item.style.borderColor = '#00ff88';
      if (owned) {
        item.innerHTML = `<div class="icon">${data.emoji}</div><div class="name">${data.name}</div><div class="price" style="color:#00ff88;">⭐ Selecionar</div>`;
        item.onclick = () => { currentPlayerData.selectedBrawler = key; saveData(); closeModal('brawlersModal'); showToast(`${data.name} selecionado!`); };
      } else {
        item.innerHTML = `<div class="icon">${data.emoji}</div><div class="name">${data.name}</div><div class="price" style="color:#ffcc00; font-size:10px;">${data.rarity}</div><div class="price">💎 ${data.price}</div>`;
        item.onclick = () => {
          if(currentPlayerData.gems >= data.price) { currentPlayerData.gems -= data.price; if(!currentPlayerData.ownedBrawlers) currentPlayerData.ownedBrawlers = {}; currentPlayerData.ownedBrawlers[key] = true; saveData(); openModal('brawlersModal'); showToast(`${data.name} desbloqueado!`); } else showToast('Gemas insuficientes!');
        };
      }
      grid.appendChild(item);
    });
  }
  if(id === 'shopModal') {
    document.getElementById('shopGrid').innerHTML = `<div class="shop-item" onclick="comprarGemas()"><div class="icon">💎</div><div class="name">1000 Gemas</div><div class="price">🪙 500 Moedas</div></div><div class="shop-item" onclick="comprarCaixa()"><div class="icon">🎁</div><div class="name">Caixa Grátis</div><div class="price">💎 100 Gemas</div></div>`;
  }
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
function returnToMenu() { document.getElementById('menuScreen').classList.remove('hide'); document.getElementById('gameScreen').classList.remove('active'); game.active = false; if(animFrame) cancelAnimationFrame(animFrame); if(timerInterval) clearInterval(timerInterval); }
function comprarGemas() { if(currentPlayerData.coins >= 500) { currentPlayerData.coins -= 500; currentPlayerData.gems += 1000; saveData(); openModal('shopModal'); showToast('+1000 Gemas!'); } else showToast('Moedas insuficientes!'); }
function comprarCaixa() { if(currentPlayerData.gems >= 100) { currentPlayerData.gems -= 100; currentPlayerData.coins += 50; currentPlayerData.gems += 10; saveData(); openModal('shopModal'); showToast('Caixa aberta!'); } else showToast('Gemas insuficientes!'); }

function updateUI() {
  if (!document.getElementById('menuTrophies')) return;
  document.getElementById('menuTrophies').innerText = currentPlayerData.trophies; document.getElementById('menuGems').innerText = currentPlayerData.gems; document.getElementById('menuCoins').innerText = currentPlayerData.coins;
  document.getElementById('menuBrawlerName').innerText = currentPlayerData.selectedBrawler.toUpperCase(); document.getElementById('menuBrawlerIcon').innerText = BRAWLER_DATA[currentPlayerData.selectedBrawler].emoji;
}
updateUI();

function startSolo() {
  closeModal('eventsModal'); document.getElementById('menuScreen').classList.add('hide'); document.getElementById('gameScreen').classList.add('active');
  game.active = true; game.bots = []; game.bullets = []; game.clouds = []; game.walls = []; game.bushes = []; game.boxes = []; game.cubes = []; game.kills = 0; game.timeLeft = 300; 
  const bData = BRAWLER_DATA[currentPlayerData.selectedBrawler];
  game.player = { x: 1500, y: 1500, hp: bData.hp, maxHp: bData.hp, brawler: currentPlayerData.selectedBrawler, shootCooldown: 0, angle: 0 };
  
  document.getElementById('gameScreen').innerHTML = `
    <div id="camera"><div id="arena"></div></div>
    <div class="hp-bar-container"><div class="hp-text" id="hpText">${bData.hp}</div><div class="hp-bar-bg"><div class="hp-bar-fill" id="hpFill"></div></div></div>
    <div class="kill-counter">Bots: <span id="killCount">0</span>/9</div>
    <div class="timer-box" id="timerDisplay">05:00</div>
    <div id="joystickZone"></div><div id="joystickBase"></div><div id="joystickKnob"></div>
    <button id="fireBtn">🔥</button>
  `;
  document.getElementById('gameScreen').style.display = 'block'; document.getElementById('gameScreen').classList.add('active');
  
  for (let i = 0; i < 20; i++) {
    let x = Math.random() * 3000, y = Math.random() * 3000, w = 150, h = 150;
    if (Math.hypot(x - 1500, y - 1500) > 400) { game.walls.push({x,y,w,h}); let el = document.createElement('div'); el.className = 'wall'; el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`; document.getElementById('arena').appendChild(el); }
  }
  for (let i = 0; i < 25; i++) {
    let x = Math.random() * 3000, y = Math.random() * 3000, r = 60;
    game.bushes.push({x,y,r}); let el = document.createElement('div'); el.className = 'bush'; el.style.cssText = `left:${x-r}px;top:${y-r}px;width:${r*2}px;height:${r*2}px`; document.getElementById('arena').appendChild(el);
  }
  
  let pEl = document.createElement('div'); pEl.className = 'player'; pEl.id = 'playerEl'; pEl.innerText = bData.emoji;
  pEl.style.left = game.player.x + 'px'; pEl.style.top = game.player.y + 'px'; document.getElementById('arena').appendChild(pEl);
  
  for (let i = 0; i < 9; i++) {
    let ang = (i / 9) * Math.PI * 2;
    let bx = 1500 + Math.cos(ang) * 400;
    let by = 1500 + Math.sin(ang) * 400;
    let b = { id: i, x: bx, y: by, hp: 2600, maxHp: 2600, speed: 1.5, shootTimer: Math.random() * 60 + 30 };
    game.bots.push(b);
    let el = document.createElement('div'); el.className = 'bot'; el.id = 'bot-' + i; el.innerText = '🤖';
    el.style.left = bx + 'px'; el.style.top = by + 'px'; document.getElementById('arena').appendChild(el);
  }
  
  spawnBoxes(); setupTouchControls(); if(animFrame) cancelAnimationFrame(animFrame); loop();
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => { if (!game.active) return; game.timeLeft--; document.getElementById('timerDisplay').innerText = `${Math.floor(game.timeLeft/60).toString().padStart(2,'0')}:${(game.timeLeft%60).toString().padStart(2,'0')}`; if (game.timeLeft <= 0) endGame('draw'); }, 1000);
  if(cloudInterval) clearInterval(cloudInterval); cloudInterval = setInterval(() => { if(game.active) spawnCloud(); }, 4000);
}

function spawnBoxes() { for (let i = 0; i < 6; i++) { let bx = 200 + Math.random() * 2600, by = 200 + Math.random() * 2600; game.boxes.push({ id: i, x: bx, y: by, hp: 1000, maxHp: 1000 }); let el = document.createElement('div'); el.className = 'box'; el.id = 'box-' + i; el.style.left = bx + 'px'; el.style.top = by + 'px'; document.getElementById('arena').appendChild(el); } }
function dropCube(x, y) { game.cubes.push({ x: x, y: y }); let el = document.createElement('div'); el.className = 'cube'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.id = 'cube-' + game.cubes.length; document.getElementById('arena').appendChild(el); }
function spawnCloud() { let cx = Math.random() * 3000, cy = Math.random() * 3000; let r = 150 + Math.random() * 100; game.clouds.push({ x: cx, y: cy, r: r }); let el = document.createElement('div'); el.className = 'cloud'; el.style.left = (cx - r) + 'px'; el.style.top = (cy - r) + 'px'; el.style.width = (r * 2) + 'px'; el.style.height = (r * 2) + 'px'; document.getElementById('arena').appendChild(el); }

function setupTouchControls() {
  const zone = document.getElementById('joystickZone'); const base = document.getElementById('joystickBase'); const knob = document.getElementById('joystickKnob'); let startX = 0, startY = 0;
  const pararBoneco = () => { moveJoystick.active = false; moveJoystick.dx = 0; moveJoystick.dy = 0; base.style.display = 'none'; knob.style.display = 'none'; };
  const handleStart = (cx, cy) => { if (!game.active) return; moveJoystick.active = true; startX = cx; startY = cy; base.style.display = 'block'; knob.style.display = 'block'; base.style.left = startX + 'px'; base.style.top = startY + 'px'; knob.style.left = startX + 'px'; knob.style.top = startY + 'px'; };
  const updateJoystick = (cx, cy) => { if (!moveJoystick.active) return; let dx = cx - startX; let dy = cy - startY; let dist = Math.hypot(dx, dy); if (dist > 50) { dx = (dx / dist) * 50; dy = (dy / dist) * 50; } moveJoystick.dx = dx; moveJoystick.dy = dy; if (dist > 10) game.player.angle = Math.atan2(dy, dx); knob.style.left = (startX + dx) + 'px'; knob.style.top = (startY + dy) + 'px'; };
  zone.addEventListener('touchstart', e => { e.preventDefault(); handleStart(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
  zone.addEventListener('touchmove', e => { e.preventDefault(); updateJoystick(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
  zone.addEventListener('touchend', e => { e.preventDefault(); pararBoneco(); }, {passive: false});
  zone.addEventListener('touchcancel', e => { e.preventDefault(); pararBoneco(); }, {passive: false});
  zone.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
  zone.addEventListener('mousemove', e => { if(moveJoystick.active) updateJoystick(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { pararBoneco(); });
  const fireBtn = document.getElementById('fireBtn');
  fireBtn.addEventListener('touchstart', e => { e.preventDefault(); autoShoot(); }, {passive: false});
  fireBtn.addEventListener('mousedown', e => { e.preventDefault(); autoShoot(); });
}

function autoShoot() {
  if (!game.active || game.player.shootCooldown > 0) return; let closestBot = null, minDist = Infinity;
  for (let b of game.bots) { let d = Math.hypot(b.x - game.player.x, b.y - game.player.y); if (d < minDist) { minDist = d; closestBot = b; } }
  if (closestBot && minDist <= 800) { let angle = Math.atan2(closestBot.y - game.player.y, closestBot.x - game.player.x); shootBullet(game.player.x + 30, game.player.y + 30, angle, 'player'); }
  else {
    let closestBox = null; minDist = Infinity;
    for (let bx of game.boxes) { let d = Math.hypot(bx.x - game.player.x, bx.y - game.player.y); if (d < minDist) { minDist = d; closestBox = bx; } }
    if (closestBox && minDist < 500) { let angle = Math.atan2(closestBox.y - game.player.y, closestBox.x - game.player.x); shootBullet(game.player.x + 30, game.player.y + 30, angle, 'player'); }
  }
}

function shootBullet(x, y, angle, owner) {
  if (owner === 'player') game.player.shootCooldown = 20;
  let speed = 15; 
  let dmg = 450; // Dano de 450 para todos
  
  let b = { x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, owner: owner, dmg: dmg, life: 60, startX: x, startY: y };
  game.bullets.push(b); let el = document.createElement('div'); el.className = 'bullet'; el.style.left = (x - 9) + 'px'; el.style.top = (y - 9) + 'px';
  if (owner === 'bot') el.style.background = '#ff4444'; document.getElementById('arena').appendChild(el); b.el = el;
}

function loop() {
  if (!game.active) return;
  
  if (moveJoystick.active) { 
    game.player.x += moveJoystick.dx * 0.08; 
    game.player.y += moveJoystick.dy * 0.08; 
  }
  game.player.x = Math.max(30, Math.min(2970, game.player.x));
  game.player.y = Math.max(30, Math.min(2970, game.player.y));

  if (game.player.shootCooldown > 0) game.player.shootCooldown--;
  document.getElementById('playerEl').style.left = game.player.x + 'px'; document.getElementById('playerEl').style.top = game.player.y + 'px';
  
  const viewW = window.innerWidth; const viewH = window.innerHeight;
  const camX = Math.max(0, Math.min(3000 - viewW, game.player.x - viewW / 2)); const camY = Math.max(0, Math.min(3000 - viewH, game.player.y - viewH / 2));
  document.getElementById('camera').style.transform = `translate(${-camX}px, ${-camY}px)`;
  
  for (let b of game.bots) {
    // Bots seguem APENAS o jogador
    let targetX = game.player.x; 
    let targetY = game.player.y; 
    let dx = targetX - b.x; 
    let dy = targetY - b.y;
    let minDist = Math.hypot(dx, dy);
    
    if (minDist > 50) { 
      b.x += (dx / minDist) * b.speed; 
      b.y += (dy / minDist) * b.speed; 
    }
    
    b.x = Math.max(30, Math.min(2970, b.x));
    b.y = Math.max(30, Math.min(2970, b.y));

    document.getElementById('bot-' + b.id).style.left = b.x + 'px'; document.getElementById('bot-' + b.id).style.top = b.y + 'px';
    
    b.shootTimer--; 
    if (b.shootTimer <= 0 && minDist < 600) { 
      b.shootTimer = 80 + Math.random() * 50; 
      shootBullet(b.x + 28, b.y + 28, Math.atan2(dy, dx), 'bot'); 
    }
  }
  
  for (let c of game.clouds) { let dist = Math.hypot(game.player.x - c.x, game.player.y - c.y); if (dist < c.r) game.player.hp -= 4; }
  
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    let b = game.bullets[i]; b.x += b.vx; b.y += b.vy; b.life--; b.el.style.left = (b.x - 9) + 'px'; b.el.style.top = (b.y - 9) + 'px'; let hit = false;
    
    // Se a bala ainda está muito perto de quem a disparou, ignora a colisão
    let distFromStart = Math.hypot(b.x - b.startX, b.y - b.startY);
    
    if (b.owner === 'player') {
      for (let j = game.bots.length - 1; j >= 0; j--) { 
        let bot = game.bots[j]; 
        if (Math.hypot(b.x - (bot.x+28), b.y - (bot.y+28)) < 35) { 
          bot.hp -= b.dmg; 
          if (bot.hp <= 0) { 
            document.getElementById('bot-' + bot.id).remove(); game.bots.splice(j, 1); game.kills++; currentPlayerData.gems += 10; 
            document.getElementById('killCount').innerText = game.kills; 
            if (game.kills >= 9) endGame('win'); 
          } 
          hit = true; break; 
        } 
      }
      if (!hit) { for (let k = game.boxes.length - 1; k >= 0; k--) { let box = game.boxes[k]; if (Math.hypot(b.x - (box.x+28), b.y - (box.y+28)) < 35) { box.hp -= b.dmg; if (box.hp <= 0) { document.getElementById('box-' + box.id).remove(); dropCube(box.x, box.y); game.boxes.splice(k, 1); } hit = true; break; } } }
    } else {
      // Bala dos bots: SÓ acerta no jogador E SÓ depois de andar pelo menos 40px
      if (distFromStart > 40 && Math.hypot(b.x - (game.player.x+28), b.y - (game.player.y+28)) < 35) { 
        game.player.hp -= b.dmg; 
        hit = true; 
      }
    }
    if (hit || b.life <= 0) { b.el.remove(); game.bullets.splice(i, 1); }
  }
  
  for (let i = game.cubes.length - 1; i >= 0; i--) { let c = game.cubes[i]; if (Math.hypot(c.x - game.player.x, c.y - game.player.y) < 45) { game.player.hp = Math.min(game.player.maxHp, game.player.hp + 500); let cubeEl = document.getElementById('cube-' + (i+1)); if(cubeEl) cubeEl.remove(); game.cubes.splice(i, 1); } }
  
  if (game.player.hp <= 0) { game.player.hp = 0; endGame('lose'); return; }
  document.getElementById('hpText').innerText = Math.floor(game.player.hp); document.getElementById('hpFill').style.width = (game.player.hp / game.player.maxHp * 100) + '%';
  if (game.player.hp / game.player.maxHp < 0.3) document.getElementById('hpFill').style.background = '#ff3333'; else document.getElementById('hpFill').style.background = '#00ff88';
  animFrame = requestAnimationFrame(loop);
}

function endGame(result) {
  game.active = false; cancelAnimationFrame(animFrame); clearInterval(timerInterval); clearInterval(cloudInterval); moveJoystick.active = false; moveJoystick.dx = 0; moveJoystick.dy = 0;
  let title = result === 'win' ? '🏆 VITÓRIA!' : (result === 'draw' ? '🤝 EMPATE' : '💀 DERROTA'); let msg = result === 'win' ? '+1000 Troféus' : 'Sem troféus desta vez.'; if (result === 'win') currentPlayerData.trophies += 1000;
  saveData(); document.getElementById('endTitle').innerText = title;
  document.getElementById('endStats').innerHTML = `<div style="color:#00ff88; font-size:18px;">Bots Eliminados: ${game.kills}/9</div><div style="color:#ffcc00; font-size:16px; margin-top:5px;">${msg}</div>`; openModal('endModal');
}

function toggleAuth() { const title = document.getElementById('authTitle'); if (title.innerText === 'Entrar') { title.innerText = 'Criar Conta'; document.getElementById('authBtn').innerText = 'Registar'; document.getElementById('authSwitch').innerText = 'Já tenho conta'; } else { title.innerText = 'Entrar'; document.getElementById('authBtn').innerText = 'Entrar'; document.getElementById('authSwitch').innerText = 'Criar nova conta'; } }
function handleAuth() { closeModal('authModal'); showToast('Login efetuado!'); }
