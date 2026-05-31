/**
 * YGGDRASIL — Système de sauvegarde partagé
 * À inclure dans chaque module via <script src="yggdrasil-save.js"></script>
 * Doit être chargé AVANT le script principal de chaque page.
 */

const YSave = (() => {
  const KEY = 'yggdrasil_save';

  // ── Sauvegarde par défaut ──────────────────────────────────────
  const DEFAULTS = {
    playerName: 'Ragnar Lothbrok',
    villageName: 'Hestvík',
    role: 'jarl',
    allianceMode: 'solo',
    allyName: '', allyCode: '',
    day: 1, seasonIdx: 0,
    glory: 0, moral: 80,
    resources: { wood: 300, stone: 200, food: 400, gold: 80, runes: 5, mead: 10, souls: 0 },
    troops: { militia: 5, warrior: 0, archer: 0, berserker: 0, shieldwall: 0, knight: 0 },
    hero: { name: 'Ragnar', level: 1, xp: 0, xpNext: 200, atk: 10, def: 8, hp: 100, talentPoints: 1, learned: [] },
    buildings: { barracks: 1 },
    explored: [],
    completedQuests: [],
    allianceData: null,
    reports: [],
    journal: [],
    firstPlay: true,
    savedAt: 0,
  };

  // ── LOAD ──────────────────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return deepClone(DEFAULTS);
      const saved = JSON.parse(raw);
      // Merge avec les defaults pour gérer les nouvelles clés
      return deepMerge(deepClone(DEFAULTS), saved);
    } catch (e) {
      console.warn('[YSave] Erreur de chargement, utilisation des valeurs par défaut', e);
      return deepClone(DEFAULTS);
    }
  }

  // ── SAVE ──────────────────────────────────────────────────────
  function save(data) {
    try {
      data.savedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[YSave] Erreur de sauvegarde', e);
      return false;
    }
  }

  // ── PATCH (mise à jour partielle) ─────────────────────────────
  function patch(partial) {
    const current = load();
    const updated = deepMerge(current, partial);
    return save(updated);
  }

  // ── RESET ─────────────────────────────────────────────────────
  function reset() {
    try { localStorage.removeItem(KEY); return true; }
    catch (e) { return false; }
  }

  // ── EXISTS ────────────────────────────────────────────────────
  function exists() {
    return localStorage.getItem(KEY) !== null;
  }

  // ── HELPERS ───────────────────────────────────────────────────
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        out[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  // ── JOURNAL NARRATIF ──────────────────────────────────────────
  const JOURNAL_TEMPLATES = [
    (d) => `Le Jour ${d.day}, ${d.playerName} mena ses guerriers contre ${d.enemy || 'les ennemis'} et en sortit victorieux.`,
    (d) => `Par une nuit de ${d.season || 'pleine lune'}, ${d.playerName} reçut un signe d'Odin.`,
    (d) => `La ${d.building || 'nouvelle construction'} fut achevée au village de ${d.villageName}. Les habitants célébrèrent.`,
    (d) => `${d.playerName} et son allié forgèrent une alliance de sang. Nul ne pourrait les séparer.`,
    (d) => `Le Jarl ${d.playerName} envoya son péon aux quatre coins de Midgard, semant richesses et espoirs.`,
    (d) => `En l'an ${d.day} de sa saga, ${d.playerName} accumula ${d.glory || 0} points de gloire au nom de Yggdrasil.`,
  ];

  function addJournalEntry(save, context) {
    const template = JOURNAL_TEMPLATES[Math.floor(Math.random() * JOURNAL_TEMPLATES.length)];
    const entry = {
      day: save.day,
      season: ['Printemps', 'Été', 'Automne', 'Hiver'][save.seasonIdx || 0],
      text: template({ ...save, ...context }),
      ts: Date.now(),
    };
    if (!save.journal) save.journal = [];
    save.journal.unshift(entry);
    if (save.journal.length > 50) save.journal = save.journal.slice(0, 50);
    return entry;
  }

  // ── AUTO-SAVE ─────────────────────────────────────────────────
  // Fournit une fonction à appeler dans setInterval
  function autoSaveHook(getStateFn, intervalMs = 30000) {
    return setInterval(() => {
      const state = getStateFn();
      if (state) {
        save(state);
        console.log('[YSave] Auto-save ✓', new Date().toLocaleTimeString('fr-FR'));
      }
    }, intervalMs);
  }

  // ── EXPORT PUBLIC ─────────────────────────────────────────────
  return { load, save, patch, reset, exists, deepClone, deepMerge, addJournalEntry, autoSaveHook };
})();

// ── INITIALISATION AUTOMATIQUE ────────────────────────────────
// Chaque page peut accéder à window.YSave directement
window.YSave = YSave;

// ── UTILITAIRE : injecter la sauvegarde dans un état existant ──
window.YSaveInit = function(stateObj) {
  const saved = YSave.load();
  // Ressources
  if (saved.resources && stateObj.resources) {
    Object.assign(stateObj.resources, saved.resources);
  }
  // Champs directs
  const directFields = ['glory', 'moral', 'day', 'seasonIdx', 'role', 'playerName', 'villageName'];
  directFields.forEach(k => { if (saved[k] !== undefined) stateObj[k] = saved[k]; });
  // Troupes
  if (saved.troops && stateObj.troops) Object.assign(stateObj.troops, saved.troops);
  // Héros
  if (saved.hero && stateObj.hero) Object.assign(stateObj.hero, saved.hero);
  // Buildings
  if (saved.buildings && stateObj.buildings) Object.assign(stateObj.buildings, saved.buildings);
  return stateObj;
};

// ── UTILITAIRE : extraire l'état d'un module pour sauvegarde ──
window.YSaveExtract = function(stateObj) {
  return {
    resources: { ...stateObj.resources },
    glory: stateObj.glory,
    moral: stateObj.moral,
    day: stateObj.day,
    seasonIdx: stateObj.seasonIdx,
    role: stateObj.role,
    playerName: stateObj.playerName || stateObj.player,
    villageName: stateObj.villageName,
    troops: { ...stateObj.troops },
    hero: { ...stateObj.hero, learned: stateObj.hero?.learned ? [...stateObj.hero.learned] : [] },
    buildings: { ...stateObj.buildings },
    reports: (stateObj.reports || []).slice(0, 20),
    journal: stateObj.journal || [],
  };
};
