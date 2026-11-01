let game = { active: false, player: {}, bots: [], bullets: [], walls: [], bushes: [], clouds: [], boxes: [], cubes: [], timeLeft: 300, kills: 0 };
let moveJoystick = { active: false, dx: 0, dy: 0, touchId: null };
let animFrame = null, timerInterval = null, cloudInterval = null;

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
function returnToMenu() { document.getElementById('menuScreen').classList.remove('hide'); document.getElementById('gameScreen').classList.remove('active'); game.active = false; if(animFrame) cancelAnimationFrame(animFrame); if(timerInterval) clearInterval(timerInterval); }

function updateUI() {
  if (!document.getElementById('menuTrophies')) return;
  document.getElementById('menuTrophies').innerText = currentPlayerData.trophies;
  document.getElementById('menuGems').innerText = currentPlayerData.gems;
  document.getElementById('menuCoins').innerText = currentPlayerData.coins;
  document.getElementById('menuBrawlerName').innerText = currentPlayerData.selectedBrawler.toUpperCase();
  document.getElementById('menuBrawlerIcon').innerText = BRAWLER_DATA[currentPlayerData.selectedBrawler].emoji;
}
updateUI();

function startSolo() {
  closeModal('eventsModal');
  document.getElementById('menuScreen').classList.add('hide');
  document.getElementById('gameScreen').classList.add('active');
  
  game.active = true; game.bots = []; game.bullets = []; game.clouds = []; game.walls = []; game.bushes = []; game.boxes = []; game.cubes = [];
  game.kills = 0; game.timeLeft = 300; 
  
  const bData = BRAWLER_DATA[currentPlayerData.selectedBrawler];
  game.player = { x: 1500, y: 1500, hp: bData.hp, maxHp: bData.hp, brawler: currentPlayerData.selectedBrawler, shootCooldown: 0, angle: 0 };
  
  const gameScreen = document.getElementById('gameScreen');
  gameScreen.innerHTML = `
    <div id="camera"><div id="arena"></div></div>
    <div class="hp-bar-container"><div class="hp-text" id="hpText">${bData.hp}</div><div class="hp-bar-bg"><div class="hp-bar-fill" id="hpFill"></div></div></div>
    <div class="kill-counter">Bots: <span id="killCount">0</span>/9</div>
    <div class="timer-box" id="timerDisplay">05:00</div>
    <div id="joystickZone"></div>
    <button id="fireBtn">🔥</button>
  `;
  gameScreen.style.display = 'block';
  gameScreen.classList.add('active');
  
  for (let i = 0; i < 20; i++) {
    let x = Math.random() * 3000, y = Math.random() * 3000, w = 150, h = 150;
    if (Math.hypot(x - 1500, y - 1500) > 400) {
      game.walls.push({x,y,w,h});
      let el = document.createElement('div'); el.className = 'wall'; el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      document.getElementById('arena').appendChild(el);
    }
  }
  for (let i = 0; i < 25; i++) {
    let x = Math.random() * 3000, y = Math.random() * 3000, r = 60;
    game.bushes.push({x,y,r});
    let el = document.createElement('div'); el.className = 'bush'; el.style.cssText = `left:${x-r}px;top:${y-r}px;width:${r*2}px;height:${r*2}px`;
    document.getElementById('arena').appendChild(el);
  }
  
  let pEl = document.createElement('div'); pEl.className = 'player'; pEl.id = 'playerEl'; pEl.innerText = bData.emoji;
  pEl.style.left = game.player.x + 'px'; pEl.style.top = game.player.y + 'px';
  document.getElementById('arena').appendChild(pEl);
  
  for (let i = 0; i < 9; i++) {
    let bx = 100 + Math.random() * 2800, by = 100 + Math.random() * 2800;
    if (Math.hypot(bx - 1500, by - 1500) < 600) { bx += 700; by += 700; }
    let b = { id: i, x: bx, y: by, hp: 650, maxHp: 650, speed: 1.5, shootTimer: Math.random() * 60 };
    game.bots.push(b);
    let el = document.createElement('div'); el.className = 'bot'; el.id = 'bot-' + i; el.innerText = '🤖';
    el.style.left = bx + 'px'; el.style.top = by + 'px';
    document.getElementById('arena').appendChild(el);
  }
  
  spawnBoxes(); setupTouchControls();
  if(animFrame) cancelAnimationFrame(animFrame); loop();
  
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!game.active) return;
    game.timeLeft--;
    document.getElementById('timerDisplay').innerText = `${Math.floor(game.timeLeft/60).toString().padStart(2,'0')}:${(game.timeLeft%60).toString().padStart(2,'0')}`;
    if (game.timeLeft <= 0) endGame('draw');
  }, 1000);
  
  if(cloudInterval) clearInterval(cloudInterval);
  cloudInterval = setInterval(() => { if(game.active) spawnCloud(); }, 4000);
}

function spawnBoxes() {
  for (let i = 0; i < 6; i++) {
    let bx = 200 + Math.random() * 2600, by = 200 + Math.random() * 2600;
    game.boxes.push({ id: i, x: bx, y: by, hp: 1000, maxHp: 1000 });
    let el = document.createElement('div'); el.className = 'box'; el.id = 'box-' + i;
    el.style.left = bx + 'px'; el.style.top = by + 'px';
    document.getElementById('arena').appendChild(el);
  }
}

function dropCube(x, y) {
  game.cubes.push({ x: x, y: y });
  let el = document.createElement('div'); el.className = 'cube'; el.style.left = x + 'px'; el.style.top = y + 'px';
  el.id = 'cube-' + game.cubes.length;
  document.getElementById('arena').appendChild(el);
}

function spawnCloud() {
  let cx = Math.random() * 3000, cy = Math.random() * 3000;
  let r = 150 + Math.random() * 100;
  game.clouds.push({ x: cx, y: cy, r: r });
  let el = document.createElement('div'); el.className = 'cloud';
  el.style.left = (cx - r) + 'px'; el.style.top = (cy - r) + 'px';
  el.style.width = (r * 2) + 'px'; el.style.height = (r * 2) + 'px';
  document.getElementById('arena').appendChild(el);
}

function setupTouchControls() {
  const zone = document.getElementById('joystickZone');
  
  const handleStart = (clientX, clientY, id) => {
    if (!game.active) return;
    moveJoystick.active = true;
    moveJoystick.touchId = id;
    moveJoystick.startX = window.innerWidth / 2;
    moveJoystick.startY = window.innerHeight / 2;
    updateJoystick(clientX, clientY);
  };

  const updateJoystick = (clientX, clientY) => {
    let dx = clientX - moveJoystick.startX;
    let dy = clientY - moveJoystick.startY;
    let dist = Math.hypot(dx, dy);
    if (dist > 50) { dx = (dx / dist) * 50; dy = (dy / dist) * 50; }
    moveJoystick.dx = dx;
    moveJoystick.dy = dy;
    if (dist > 10) game.player.angle = Math.atan2(dy, dx);
  };

  const handleEnd = () => {
    moveJoystick.active = false;
    moveJoystick.dx = 0;
    moveJoystick.dy = 0;
    moveJoystick.touchId = null;
  };

  // Toque
  zone.addEventListener('touchstart', e => { e.preventDefault(); for(let t of e.changedTouches) handleStart(t.clientX, t.clientY, t.identifier); }, {passive: false});
  zone.addEventListener('touchmove', e => { e.preventDefault(); for(let t of e.changedTouches) { if(t.identifier === moveJoystick.touchId) updateJoystick(t.clientX, t.clientY); } }, {passive: false});
  zone.addEventListener('touchend', e => { e.preventDefault(); handleEnd(); }, {passive: false});
  zone.addEventListener('touchcancel', e => { handleEnd(); }, {passive: false});
  
  // Rato (PC)
  zone.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY, 'mouse'));
  zone.addEventListener('mousemove', e => { if(moveJoystick.active) updateJoystick(e.clientX, e.clientY); });
  // Força a paragem em qualquer lugar da tela se soltar o rato
  window.addEventListener('mouseup', () => { if(moveJoystick.active) handleEnd(); });
  
  const fireBtn = document.getElementById('fireBtn');
  fireBtn.addEventListener('touchstart', e => { e.preventDefault(); autoShoot(); }, {passive: false});
  fireBtn.addEventListener('mousedown', e => { autoShoot(); });
}

// ================= TIRO AUTOMÁTICO =================
function autoShoot() {
  if (!game.active || game.player.shootCooldown > 0) return;
  let closestBot = null, minDist = Infinity;
  
  for (let b of game.bots) {
    let d = Math.hypot(b.x - game.player.x, b.y - game.player.y);
    if (d < minDist) { minDist = d; closestBot = b; }
  }
  
  if (closestBot && minDist <= 800) {
    let angle = Math.atan2(closestBot.y - game.player.y, closestBot.x - game.player.x);
    shootBullet(game.player.x + 30, game.player.y + 30, angle, 'player');
  } else {
    let closestBox = null; minDist = Infinity;
    for (let bx of game.boxes) {
      let d = Math.hypot(bx.x - game.player.x, bx.y - game.player.y);
      if (d < minDist) { minDist = d; closestBox = bx; }
    }
    if (closestBox && minDist < 500) {
      let angle = Math.atan2(closestBox.y - game.player.y, closestBox.x - game.player.x);
      shootBullet(game.player.x + 30, game.player.y + 30, angle, 'player');
    }
  }
}

function shootBullet(x, y, angle, owner) {
  if (owner === 'player') game.player.shootCooldown = 20;
  let speed = 15;
  let dmg = owner === 'player' ? BRAWLER_DATA[game.player.brawler].dmg : 550;
  let b = { x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, owner: owner, dmg: dmg, life: 60 };
  game.bullets.push(b);
  let el = document.createElement('div'); el.className = 'bullet';
  el.style.left = (x - 9) + 'px'; el.style.top = (y - 9) + 'px';
  if (owner === 'bot') el.style.background = '#ff4444';
  document.getElementById('arena').appendChild(el);
  b.el = el;
}

// ================= LOOP DO JOGO =================
function loop() {
  if (!game.active) return;
  
  // Movimento do jogador
  if (moveJoystick.active) {
    game.player.x += moveJoystick.dx * 0.08;
    game.player.y += moveJoystick.dy * 0.08;
  }
  
  if (game.player.shootCooldown > 0) game.player.shootCooldown--;
  document.getElementById('playerEl').style.left = game.player.x + 'px';
  document.getElementById('playerEl').style.top = game.player.y + 'px';
  
  // Câmara
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const camX = Math.max(0, Math.min(3000 - viewW, game.player.x - viewW / 2));
  const camY = Math.max(0, Math.min(3000 - viewH, game.player.y - viewH / 2));
  document.getElementById('camera').style.transform = `translate(${-camX}px, ${-camY}px)`;
  
  // ================= BOTS A ATACAREM TUDO =================
  for (let b of game.bots) {
    // Encontra o alvo mais próximo (o player ou outro bot)
    let targetX = game.player.x;
    let targetY = game.player.y;
    let minDist = Math.hypot(targetX - b.x, targetY - b.y);
    let targetType = 'player';

    for (let otherBot of game.bots) {
      if (otherBot.id === b.id) continue;
      let d = Math.hypot(otherBot.x - b.x, otherBot.y - b.y);
      if (d < minDist) {
        minDist = d;
        targetX = otherBot.x;
        targetY = otherBot.y;
        targetType = 'bot';
      }
    }

    let dx = targetX - b.x;
    let dy = targetY - b.y;

    if (minDist > 50) {
      b.x += (dx / minDist) * b.speed;
      b.y += (dy / minDist) * b.speed;
    }
    
    document.getElementById('bot-' + b.id).style.left = b.x + 'px';
    document.getElementById('bot-' + b.id).style.top = b.y + 'px';
    
    b.shootTimer--;
    if (b.shootTimer <= 0 && minDist < 600) {
      b.shootTimer = 80 + Math.random() * 50;
      shootBullet(b.x + 28, b.y + 28, Math.atan2(dy, dx), 'bot');
    }
  }
  
  // Nuvem
  for (let c of game.clouds) {
    let dist = Math.hypot(game.player.x - c.x, game.player.y - c.y);
    if (dist < c.r) game.player.hp -= 4;
  }
  
  // Balas
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    let b = game.bullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    b.el.style.left = (b.x - 9) + 'px'; b.el.style.top = (b.y - 9) + 'px';
    
    let hit = false;
    
    // Balas de qualquer um podem acertar em qualquer um
    if (b.owner === 'player') {
      for (let j = game.bots.length - 1; j >= 0; j--) {
        let bot = game.bots[j];
        if (Math.hypot(b.x - (bot.x+28), b.y - (bot.y+28)) < 35) {
          bot.hp -= b.dmg;
          if (bot.hp <= 0) {
            document.getElementById('bot-' + bot.id).remove();
            game.bots.splice(j, 1); game.kills++;
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
          if (Math.hypot(b.x - (box.x+28), b.y - (box.y+28)) < 35) {
            box.hp -= b.dmg;
            if (box.hp <= 0) {
              document.getElementById('box-' + box.id).remove();
              dropCube(box.x, box.y); game.boxes.splice(k, 1);
            }
            hit = true; break;
          }
        }
      }
    } else {
      // Bala de bot
      // Acerta no player?
      if (Math.hypot(b.x - (game.player.x+28), b.y - (game.player.y+28)) < 35) {
        game.player.hp -= b.dmg; hit = true;
      }
      // Acerta em outro bot?
      if (!hit) {
        for (let j = game.bots.length - 1; j >= 0; j--) {
          let bot = game.bots[j];
          if (Math.hypot(b.x - (bot.x+28), b.y - (bot.y+28)) < 35) {
            bot.hp -= b.dmg;
            if (bot.hp <= 0) {
              document.getElementById('bot-' + bot.id).remove();
              game.bots.splice(j, 1);
            }
            hit = true; break;
          }
        }
      }
    }
    if (hit || b.life <= 0) { b.el.remove(); game.bullets.splice(i, 1); }
  }
  
  // Cubos
  for (let i = game.cubes.length - 1; i >= 0; i--) {
    let c = game.cubes[i];
    if (Math.hypot(c.x - game.player.x, c.y - game.player.y) < 45) {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 500);
      let cubeEl = document.getElementById('cube-' + (i+1)); if(cubeEl) cubeEl.remove();
      game.cubes.splice(i, 1);
    }
  }
  
  if (game.player.hp <= 0) { game.player.hp = 0; endGame('lose'); return; }
  document.getElementById('hpText').innerText = Math.floor(game.player.hp);
  document.getElementById('hpFill').style.width = (game.player.hp / game.player.maxHp * 100) + '%';
  if (game.player.hp / game.player.maxHp < 0.3) document.getElementById('hpFill').style.background = '#ff3333';
  else document.getElementById('hpFill').style.background = '#00ff88';
  
  animFrame = requestAnimationFrame(loop);
}

function endGame(result) {
  game.active = false;
  cancelAnimationFrame(animFrame); clearInterval(timerInterval); clearInterval(cloudInterval);
  moveJoystick.active = false; moveJoystick.dx = 0; moveJoystick.dy = 0;
  let title = result === 'win' ? '🏆 VITÓRIA!' : (result === 'draw' ? '🤝 EMPATE' : '💀 DERROTA');
  let msg = result === 'win' ? '+1000 Troféus' : 'Sem troféus desta vez.';
  if (result === 'win') currentPlayerData.trophies += 1000;
  
  localStorage.setItem('combateRoyale', JSON.stringify(currentPlayerData));
  updateUI();
  
  document.getElementById('endTitle').innerText = title;
  document.getElementById('endStats').innerHTML = `
    <div style="color:#00ff88; font-size:18px;">Bots Eliminados: ${game.kills}/9</div>
    <div style="color:#ffcc00; font-size:16px; margin-top:5px;">${msg}</div>
  `;
  openModal('endModal');
}

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
