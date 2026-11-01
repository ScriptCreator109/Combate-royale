const BRAWLER_DATA = {
  shelly: { name: 'Shelly', hp: 5000, dmg: 500, emoji: '🥷' },
  colt: { name: 'Colt', hp: 4200, dmg: 400, emoji: '🤠' },
  primo: { name: 'El Primo', hp: 8000, dmg: 800, emoji: '🤼' },
  spike: { name: 'Spike', hp: 3600, dmg: 600, emoji: '🌵' },
  corvo: { name: 'Corvo', hp: 3400, dmg: 450, emoji: '🐦' }
};

let currentPlayerData = { trophies: 0, gems: 0, coins: 0, selectedBrawler: 'shelly' };

// Carregar dados do telemóvel (LocalStorage)
try {
  const saved = localStorage.getItem('combateRoyale');
  if (saved) currentPlayerData = JSON.parse(saved);
} catch(e) {}

function saveData() {
  localStorage.setItem('combateRoyale', JSON.stringify(currentPlayerData));
  updateUI();
}

function updateUI() {
  if (document.getElementById('menuTrophies')) {
    document.getElementById('menuTrophies').innerText = currentPlayerData.trophies;
    document.getElementById('menuGems').innerText = currentPlayerData.gems;
    document.getElementById('menuCoins').innerText = currentPlayerData.coins;
    document.getElementById('menuBrawlerName').innerText = currentPlayerData.selectedBrawler.toUpperCase();
    document.getElementById('menuBrawlerIcon').innerText = BRAWLER_DATA[currentPlayerData.selectedBrawler].emoji;
  }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
function returnToMenu() { document.getElementById('menuScreen').classList.remove('hide'); document.getElementById('gameScreen').classList.remove('active'); game.active = false; if(animFrame) cancelAnimationFrame(animFrame); if(timerInterval) clearInterval(timerInterval); }
