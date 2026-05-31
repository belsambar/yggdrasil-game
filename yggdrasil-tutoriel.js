/**
 * YGGDRASIL — Tutoriel interactif
 * À inclure dans yggdrasil-carte.html via <script src="yggdrasil-tutoriel.js"></script>
 * Le tutoriel se déclenche automatiquement si c'est la première partie (save.firstPlay === true).
 * Il peut être sauté à tout moment.
 */

const YTutorial = (() => {

  // ── ÉTAPES ──────────────────────────────────────────────────
  const STEPS = [
    {
      id: 'welcome',
      target: null, // Pas de cible, modal centré
      title: '⚔ Bienvenue dans Yggdrasil !',
      text: `Vous êtes <strong>Jarl</strong> d'un village viking au cœur de Midgard.<br><br>
             Cette courte introduction vous guidera à travers les bases du jeu.<br>
             Vous pouvez la sauter à tout moment.`,
      position: 'center',
      highlight: null,
    },
    {
      id: 'map_intro',
      target: '#map-container',
      title: '🗺 La Carte',
      text: `Voici votre carte de <strong>17×17 cases</strong>.<br><br>
             🏰 Votre village est au centre. Les cases grises sont encore dans le brouillard de guerre.<br><br>
             <em>Cliquez sur une case pour l'explorer ou interagir avec elle.</em>`,
      position: 'bottom-right',
      highlight: 'map-container',
    },
    {
      id: 'village_cell',
      target: null,
      title: '🏰 Votre Village',
      text: `La case <strong>🏰</strong> est votre village.<br><br>
             Cliquez dessus pour voir le menu radial, puis choisissez <em>Village</em> pour gérer vos bâtiments, ou <em>Armée</em> pour recruter des troupes.`,
      position: 'center',
      highlight: null,
      action: () => {
        // Faire briller la case du village
        const vc = document.getElementById('cell-8-8');
        if (vc) { vc.style.animation = 'tutPulse .6s ease-in-out 5'; }
        setTimeout(() => { if (vc) vc.style.animation = ''; }, 3100);
      },
    },
    {
      id: 'exploration',
      target: null,
      title: '🔭 Explorer',
      text: `Les cases grises sont dans le <strong>brouillard de guerre</strong>.<br><br>
             Cliquez sur une case encore inexplorée (mais proche) pour l'explorer. Plus vous explorez, plus vous découvrez ressources, clans et événements.`,
      position: 'center',
      highlight: null,
    },
    {
      id: 'ai_clans',
      target: null,
      title: '🐺 Clans IA',
      text: `Des clans <strong>IA vivants</strong> peuplent Midgard.<br><br>
             🔴 <strong>Hostile</strong> — attaquez ou payez un tribut<br>
             🟡 <strong>Neutre</strong> — négociez pour améliorer les relations<br>
             🟢 <strong>Allié</strong> — échanges et soutien mutuel<br><br>
             Clic droit sur leur case pour plus d'infos.`,
      position: 'center',
    },
    {
      id: 'resources',
      target: '#res-bar',
      title: '📦 Ressources',
      text: `Vos ressources sont affichées en haut.<br><br>
             🪵 Bois · 🪨 Pierre · 🌾 Nourriture · 🪙 Or · ᚱ Runes · 🍺 Hydromel<br><br>
             Elles augmentent automatiquement selon votre terrain et la saison. L'automne double la production !`,
      position: 'bottom',
      highlight: 'res-bar',
    },
    {
      id: 'seasons',
      target: '#season-chip',
      title: '🍂 Saisons',
      text: `Les <strong>4 saisons</strong> changent toutes les 28 jours et affectent tout :<br><br>
             🌱 Printemps : +30% production<br>
             ☀ Été : Recrutement accéléré<br>
             🍂 Automne : ×2 récolte (⚠ constituez des provisions !)<br>
             ❄ Hiver : −50% production, magie amplifiée`,
      position: 'bottom',
      highlight: 'season-chip',
    },
    {
      id: 'events',
      target: '#events-log',
      title: '📋 Événements',
      text: `Les événements s'affichent ici en temps réel : raids ennemis, signes divins, guerres entre clans...<br><br>
             Sur la carte, une case qui <strong>pulse</strong> indique un événement actif. Cliquez dessus pour le résoudre.`,
      position: 'right',
      highlight: 'events-log',
    },
    {
      id: 'navigation',
      target: '.nav-links',
      title: '🧭 Navigation',
      text: `Les <strong>5 modules</strong> du jeu :<br><br>
             🗺 Carte · 🏘 Village · ⚔ Armée · 🤝 Alliance · 📜 Quêtes<br><br>
             Votre progression est <strong>sauvegardée automatiquement</strong> toutes les 30 secondes et à chaque action importante.`,
      position: 'bottom',
      highlight: 'nav-links-wrap',
    },
    {
      id: 'end',
      target: null,
      title: '✦ Bonne Saga !',
      text: `Vous êtes prêt, <strong id="tut-player-name">Jarl</strong> !<br><br>
             Explorez, combattez, forgez des alliances et guidez votre peuple vers le Valhalla.<br><br>
             <em>Les dieux observent. Ne les décevez pas.</em>`,
      position: 'center',
    },
  ];

  let currentStep = 0;
  let active = false;
  let overlay = null;

  // ── CSS ─────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ygg-tut-styles')) return;
    const style = document.createElement('style');
    style.id = 'ygg-tut-styles';
    style.textContent = `
      #tut-overlay { position:fixed; inset:0; z-index:1000; pointer-events:none; }
      #tut-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:999; }
      #tut-box {
        position:fixed; z-index:1001; background:rgba(8,5,1,.98);
        border:1px solid rgba(200,150,12,.7); border-radius:8px;
        padding:1.2rem 1.5rem; max-width:340px; min-width:260px;
        box-shadow:0 0 40px rgba(200,150,12,.3);
        animation:tutBoxIn .35s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes tutBoxIn { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
      #tut-box::before {
        content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg,transparent,#c8960c,transparent);
        border-radius:8px 8px 0 0;
      }
      .tut-title { font-family:'Uncial Antiqua',serif; font-size:.95rem; color:#f0c040;
        letter-spacing:1px; margin-bottom:.55rem; }
      .tut-text { font-size:.8rem; color:#d4b896; line-height:1.75; margin-bottom:.9rem; }
      .tut-text strong { color:#f0dfc0; }
      .tut-text em { color:#8a7055; }
      .tut-footer { display:flex; align-items:center; gap:.5rem; }
      .tut-btn { padding:.32rem .8rem; font-family:'Uncial Antiqua',serif; font-size:.72rem;
        letter-spacing:1px; border-radius:3px; cursor:pointer; transition:all .2s; }
      .tut-btn-next { background:rgba(200,150,12,.15); border:1px solid rgba(200,150,12,.6);
        color:#c8960c; flex:1; }
      .tut-btn-next:hover { background:rgba(200,150,12,.28); }
      .tut-btn-skip { background:none; border:1px solid rgba(138,112,85,.3); color:#8a7055;
        font-size:.65rem; }
      .tut-btn-skip:hover { color:#d4b896; border-color:#8a7055; }
      .tut-dots { display:flex; gap:.3rem; flex:1; justify-content:center; }
      .tut-dot { width:5px; height:5px; border-radius:50%; background:rgba(200,150,12,.25); transition:background .2s; }
      .tut-dot.on { background:#c8960c; }
      .tut-highlight { outline:2px solid rgba(200,150,12,.8) !important;
        outline-offset:3px !important; box-shadow:0 0 20px rgba(200,150,12,.4) !important;
        border-radius:4px; z-index:1002 !important; position:relative; }
      @keyframes tutPulse {
        0%,100% { box-shadow:0 0 0 0 rgba(200,150,12,.5); }
        50% { box-shadow:0 0 0 8px rgba(200,150,12,0); }
      }
    `;
    document.head.appendChild(style);
  }

  // ── DÉMARRER ────────────────────────────────────────────────
  function start(playerName) {
    if (active) return;
    active = true;
    currentStep = 0;
    injectStyles();

    // Backdrop
    const bd = document.createElement('div');
    bd.id = 'tut-backdrop';
    bd.onclick = () => {}; // absorbe les clics
    document.body.appendChild(bd);

    overlay = document.createElement('div');
    overlay.id = 'tut-overlay';
    document.body.appendChild(overlay);

    // Mettre à jour le nom dans la dernière étape
    const lastStep = STEPS.find(s => s.id === 'end');
    if (lastStep && playerName) {
      lastStep.text = lastStep.text.replace('Jarl', playerName);
    }

    showStep(0);
  }

  // ── AFFICHER UNE ÉTAPE ──────────────────────────────────────
  function showStep(idx) {
    currentStep = idx;
    const step = STEPS[idx];
    if (!step) { end(); return; }

    // Retirer l'ancien highlight
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));

    // Appliquer l'action optionnelle
    step.action?.();

    // Highlight
    if (step.highlight) {
      const el = document.getElementById(step.highlight) || document.querySelector('.'+step.highlight);
      if (el) el.classList.add('tut-highlight');
    }

    // Supprimer ancien box
    document.getElementById('tut-box')?.remove();

    // Créer le box
    const box = document.createElement('div');
    box.id = 'tut-box';

    const dotsHtml = STEPS.map((_, i) =>
      `<div class="tut-dot ${i === idx ? 'on' : ''}"></div>`).join('');

    box.innerHTML = `
      <div class="tut-title">${step.title}</div>
      <div class="tut-text">${step.text}</div>
      <div class="tut-footer">
        <button class="tut-btn tut-btn-skip" onclick="YTutorial.skip()">Passer</button>
        <div class="tut-dots">${dotsHtml}</div>
        <button class="tut-btn tut-btn-next" onclick="YTutorial.next()">
          ${idx < STEPS.length - 1 ? 'Suivant →' : '✦ Commencer !'}
        </button>
      </div>`;

    document.body.appendChild(box);
    positionBox(box, step);
  }

  // ── POSITIONNER LE BOX ──────────────────────────────────────
  function positionBox(box, step) {
    const margin = 20;
    const bw = box.offsetWidth || 320;
    const bh = box.offsetHeight || 180;
    const ww = window.innerWidth, wh = window.innerHeight;

    if (step.position === 'center' || !step.target) {
      box.style.left = ((ww - bw) / 2) + 'px';
      box.style.top = ((wh - bh) / 2) + 'px';
      return;
    }

    const target = document.querySelector(step.target);
    if (!target) {
      box.style.left = ((ww - bw) / 2) + 'px';
      box.style.top = ((wh - bh) / 2) + 'px';
      return;
    }

    const r = target.getBoundingClientRect();
    let left, top;

    switch (step.position) {
      case 'bottom':
        left = r.left + (r.width - bw) / 2;
        top = r.bottom + margin;
        break;
      case 'bottom-right':
        left = r.right - bw;
        top = r.bottom + margin;
        break;
      case 'right':
        left = r.right + margin;
        top = r.top + (r.height - bh) / 2;
        break;
      default:
        left = r.left + (r.width - bw) / 2;
        top = r.bottom + margin;
    }

    // Clamp dans la fenêtre
    left = Math.max(margin, Math.min(ww - bw - margin, left));
    top = Math.max(margin, Math.min(wh - bh - margin, top));

    box.style.left = left + 'px';
    box.style.top = top + 'px';
  }

  // ── NAVIGATION ──────────────────────────────────────────────
  function next() {
    if (currentStep < STEPS.length - 1) showStep(currentStep + 1);
    else end();
  }

  function prev() {
    if (currentStep > 0) showStep(currentStep - 1);
  }

  function skip() {
    if (confirm('Passer le tutoriel ?')) end();
  }

  // ── FIN ─────────────────────────────────────────────────────
  function end() {
    active = false;
    document.getElementById('tut-box')?.remove();
    document.getElementById('tut-backdrop')?.remove();
    document.getElementById('tut-overlay')?.remove();
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
    // Marquer firstPlay = false dans la sauvegarde
    if (window.YSave) YSave.patch({ firstPlay: false });
    else {
      try {
        const s = JSON.parse(localStorage.getItem('yggdrasil_save') || '{}');
        s.firstPlay = false;
        localStorage.setItem('yggdrasil_save', JSON.stringify(s));
      } catch(e) {}
    }
  }

  // ── AUTO-DÉCLENCHEMENT ──────────────────────────────────────
  function autoStart() {
    try {
      const s = JSON.parse(localStorage.getItem('yggdrasil_save') || '{}');
      const name = s.playerName || 'Jarl';
      if (s.firstPlay !== false) {
        // Délai pour laisser la carte se charger
        setTimeout(() => start(name), 1200);
      }
    } catch(e) {}
  }

  // Lancement automatique quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    setTimeout(autoStart, 800);
  }

  // ── EXPORT ──────────────────────────────────────────────────
  return { start, next, prev, skip, end, isActive: () => active };
})();

window.YTutorial = YTutorial;
