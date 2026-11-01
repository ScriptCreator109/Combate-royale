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
