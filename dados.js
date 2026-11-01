const BRAWLER_DATA = {
  shelly: { name: 'Shelly', hp: 5000, dmg: 500, emoji: '🥷', price: 0, rarity: 'Inicial' },
  colt: { name: 'Colt', hp: 4200, dmg: 400, emoji: '🤠', price: 500, rarity: 'Raro' },
  primo: { name: 'El Primo', hp: 8000, dmg: 800, emoji: '🤼', price: 1000, rarity: 'Super Raro' },
  sirius: { name: 'Sirius', hp: 4500, dmg: 600, emoji: '🦇', price: 1500, rarity: 'Épico' },
  case: { name: 'Case', hp: 4800, dmg: 550, emoji: '📦', price: 1500, rarity: 'Épico' },
  cosmos: { name: 'Cosmos', hp: 4000, dmg: 650, emoji: '🌌', price: 2000, rarity: 'Mítico' },
  vince: { name: 'Vince', hp: 5200, dmg: 500, emoji: '🏹', price: 1000, rarity: 'Super Raro' },
  bolt: { name: 'Bolt', hp: 3800, dmg: 700, emoji: '⚡', price: 2000, rarity: 'Mítico' },
  spike: { name: 'Spike', hp: 3600, dmg: 600, emoji: '🌵', price: 3000, rarity: 'Lendário' },
  corvo: { name: 'Corvo', hp: 3400, dmg: 450, emoji: '🐦', price: 3000, rarity: 'Lendário' },
  mortis: { name: 'Mortis', hp: 4600, dmg: 800, emoji: '🦇', price: 3000, rarity: 'Lendário' },
  bibi: { name: 'Bibi', hp: 5500, dmg: 750, emoji: '⚾', price: 2000, rarity: 'Mítico' },
  edgar: { name: 'Edgar', hp: 6000, dmg: 900, emoji: '🧣', price: 3000, rarity: 'Lendário' }
};

// Agora guarda os brawlers que o jogador já comprou
let currentPlayerData = { 
  trophies: 0, 
  gems: 0, 
  coins: 0, 
  selectedBrawler: 'shelly', 
  ownedBrawlers: { shelly: true } 
};

try {
  const saved = localStorage.getItem('combateRoyale');
  if (saved) currentPlayerData = JSON.parse(saved);
} catch(e) {}

function saveData() {
  localStorage.setItem('combateRoyale', JSON.stringify(currentPlayerData));
  updateUI();
}
