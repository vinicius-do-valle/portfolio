/*
===============================================================================
 Project Authorship Notice
-------------------------------------------------------------------------------

 This project, including its HTML structure, CSS styling, JavaScript logic,
 architecture, and implementation, was originally conceived, designed,
 developed, and maintained by Xeeeva (Vinicius Valle Rodrigues).

 All source code, technical solutions, system architecture, visual design,
 and associated implementations contained within this project constitute
 original work by the author unless explicitly stated otherwise.

 Attribution to the original author should be preserved in all copies,
 modifications, distributions, and derivative works of this codebase.

 Copyright © 2026 Xeeeva (Vinicius Valle Rodrigues). All Rights Reserved.

===============================================================================
*/

// ── Discord Stats ────────────────────────────────────────────────
const STAT_INVITES = [
  { invite: 'volleyballlegends', label: 'Volleyball Legends' },
  { invite: 'itsatrap',          label: "IT'S A TRAP"        },
  { invite: 'mush',              label: 'Mush'               },
  { invite: 'UKPg88Weeh',        label: 'Decorations for Server' },
  { invite: 'hylex',             label: 'Hylex'              },
];

// ── Roblox Stats ─────────────────────────────────────────────────
const ROBLOX_GAMES = [
  { universeId: '6931042565',  label: 'Volleyball Legends' },
  { universeId: '9875383684',  label: 'Be a Brainrot'      },
  { universeId: '10208988072', label: 'Evade Lander'       },
];

// live data cache
let discordData = [];
let robloxData  = [];

function fmtBig(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000)         return Math.round(n / 1_000) + 'K';
  return n.toLocaleString();
}

// ── animateCount ─────────────────────────────────────────────────
function animateCount(el, target) {
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(ease * target);

    if (target >= 1_000_000) {
      el.innerHTML = (current / 1_000_000).toFixed(1).replace('.0', '') + 'M<em>+</em>';
    } else if (target >= 1_000) {
      el.innerHTML = Math.round(current / 1_000) + 'K<em>+</em>';
    } else {
      el.innerHTML = current + '<em>+</em>';
    }

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function observeStats() {
  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statObserver.unobserve(entry.target);
        const raw = entry.target.dataset.target;
        if (raw) animateCount(entry.target, Number(raw));
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-target]').forEach(el => statObserver.observe(el));
}

// ── Discord fetch ─────────────────────────────────────────────────
async function fetchDiscord() {
  const results = await Promise.all(
    STAT_INVITES.map(s =>
      fetch(`https://discord.com/api/v9/invites/${s.invite}?with_counts=true`)
        .then(r => r.ok ? r.json() : null)
        .then(d => ({ label: s.label, members: d?.approximate_member_count ?? 0 }))
        .catch(() => ({ label: s.label, members: 0 }))
    )
  );
  discordData = results;
  return results;
}

// ── Roblox fetch ──────────────────────────────────────────────────
async function fetchRoblox() {
  const ids = ROBLOX_GAMES.map(g => g.universeId).join(',');
  try {
    const url = `https://games.roblox.com/v1/games?universeIds=${ids}`;
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy);
    const json = await res.json();
    const data = JSON.parse(json.contents);

    robloxData = ROBLOX_GAMES.map(g => {
      const match = data.data.find(d => String(d.id) === g.universeId);
      return {
        label:   g.label,
        visits:  match?.visits       ?? 0,
        playing: match?.playing      ?? 0,
      };
    });
  } catch {
    robloxData = ROBLOX_GAMES.map(g => ({ label: g.label, visits: 0, playing: 0 }));
  }
  return robloxData;
}

// ── Load all stats ────────────────────────────────────────────────
async function loadStats() {
  const elMembers = document.getElementById('stat-members');
  const elServers = document.getElementById('stat-servers');

  const [discord, roblox] = await Promise.all([fetchDiscord(), fetchRoblox()]);

  const totalMembers = discord.reduce((a, b) => a + b.members, 0);

  if (elServers) elServers.dataset.target = STAT_INVITES.length;
  if (elMembers) elMembers.dataset.target = totalMembers;

  observeStats();
  updatePopovers();
}

// ── Auto refresh every 60s ────────────────────────────────────────
async function refreshStats() {
  await Promise.all([fetchDiscord(), fetchRoblox()]);
  updatePopovers();

  const elMembers = document.getElementById('stat-members');
  const total = discordData.reduce((a, b) => a + b.members, 0);
  if (elMembers) elMembers.innerHTML = (total / 1_000_000).toFixed(1).replace('.0', '') + 'M<em>+</em>';
}

setInterval(refreshStats, 60_000);

loadStats();

// ── Popovers ──────────────────────────────────────────────────────
const popoverStyles = document.createElement('style');
popoverStyles.textContent = `
  .stat-card { position: relative; }

  .stat-popover {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    background: var(--ink);
    color: var(--white);
    border-radius: var(--r-md);
    padding: 14px 18px;
    min-width: 220px;
    max-width: 280px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 50;
    box-shadow: 0 16px 48px rgba(0,0,0,0.2);
  }

  .stat-card:hover .stat-popover {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .stat-popover::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--ink);
  }

  .popover-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 5px 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    font-size: 12px;
  }
  .popover-row:last-child { border-bottom: none; padding-bottom: 0; }
  .popover-row:first-child { padding-top: 0; }

  .popover-label {
    color: rgba(255,255,255,0.6);
    font-weight: 300;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popover-val {
    font-weight: 700;
    color: var(--white);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .popover-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    font-weight: 300;
    display: block;
    margin-top: 1px;
  }

  .popover-live {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #22c55e;
    margin-bottom: 10px;
  }
  .popover-live-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulseBadge 2s ease infinite;
  }
`;
document.head.appendChild(popoverStyles);

function updatePopovers() {
  // Servers popover
  const popServers = document.getElementById('pop-servers');
  if (popServers) {
    popServers.innerHTML = STAT_INVITES.map(s => `
      <div class="popover-row">
        <span class="popover-label">${s.label}</span>
        <span class="popover-val">Staff</span>
      </div>
    `).join('');
  }

  // Members popover
  const popMembers = document.getElementById('pop-members');
  if (popMembers) {
    const rows = discordData.map(s => `
      <div class="popover-row">
        <span class="popover-label">${s.label}</span>
        <span class="popover-val">${s.members ? fmtBig(s.members) : '—'}</span>
      </div>
    `).join('');
    popMembers.innerHTML = `<span class="popover-live"><span class="popover-live-dot"></span>Live from Discord</span>` + rows;
  }

  // Roblox popover
  const popGames = document.getElementById('pop-games');
  if (popGames) {
    const rows = robloxData.map(g => `
      <div class="popover-row">
        <span class="popover-label">
          ${g.label}
          <span class="popover-sub">${g.playing ? fmtBig(g.playing) + ' playing now' : ''}</span>
        </span>
        <span class="popover-val">${g.visits ? fmtBig(g.visits) : '—'}</span>
      </div>
    `).join('');
    popGames.innerHTML = `<span class="popover-live"><span class="popover-live-dot"></span>Live from Roblox</span>` + rows;
  }
}

// ── Projects ──────────────────────────────────────────────────────
const projects = [
  {
    title: "Volleyball Legends (1.90M+ Members)",
    description_card: "🔨 Largest Volleyball Community server on all of Discord.",
    description: `
      <p>Volleyball Legends is one of the largest gaming communities on Discord, with over 2.0 million members, fully dedicated to the game Volleyball Legends.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I joined the team as a Trial Moderator on July 16, was promoted to Moderator on July 30, and later became a Senior Moderator on September 17, and later became a Staff Supervisor, on December 6</li>
      </ul>
    `,
    image: "https://tr.rbxcdn.com/180DAY-a1260693b7f075c5e8482b83e0531ad7/512/512/Image/Png/noFilter.png",
    link: "https://discord.gg/volleyballlegends",
    category: "staff"
  },
  {
    title: "IT'S A TRAP (350.0K+ Members)",
    description_card: "🔨 One of the largest Brazilian YouTuber communities on Discord.",
    description: `
      <p>ITS A TRAP is a Discord community created around a well-known YouTuber, with over 350,000 members. The server is focused on geek culture, entertainment, and active community discussions.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I joined the team as a Community Journalist, producing written content for the server. I was also part of the staff team for five months before stepping down due to personal commitments, including school.</li>
      </ul>
    `,
    image: "https://www.spicybaboon.com.au/cdn/shop/products/it-s-a-trap-sticker-39922710413597.png?v=1669616751",
    link: "https://discord.gg/itsatrap",
    category: "staff"
  },
  {
    title: "Mush (190.0K+ Members)",
    description_card: "🔨 The largest Minecraft server in Brazil.",
    description: `
      <p>Mush is a Brazilian Minecraft server, with over 5000 members usually, that offers multiple game modes such as PvP, minigames, and competitive events, bringing together a large and active player base.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a Moderator on the server for five months, progressing through the team and reaching the Senior Moderator position. I eventually stepped down due to personal commitments related to school.</li>
      </ul>
    `,
    image: "https://static.wikia.nocookie.net/famosos/images/a/ad/MushMC_logo_500x.png/revision/latest?cb=20230201012535&path-prefix=pt-br",
    link: "https://discord.gg/mush",
    category: "staff"
  },
  {
    title: "Decorations for Server (150.0K+ Members)",
    description_card: "🔨 The largest artistic community server on Discord.",
    description: `
      <p>Decorations for Server is one of the largest decoration-focused communities on Discord, with over 100,000 members dedicated to server aesthetics, resources, and customization.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a Moderator for approximately one year. I eventually stepped down due to school and work commitments.</li>
      </ul>
    `,
    image: "https://cdn.discordapp.com/icons/1472578867246923913/4d3359d367027f046bfc638d325da93c.png?size=2048",
    link: "https://discord.gg/UKPg88Weeh",
    category: "staff"
  },
  {
    title: "Hylex (70.0K+ Members)",
    description_card: "🔨 The second largest Minecraft server in Brazil.",
    description: `
      <p>Hylex is a Brazilian Minecraft server that offers a variety of game modes, focusing on competitive gameplay and an active player base, with over 2500 members usually.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked on the server as a Builder and later as a Senior Moderator for seven months. I eventually left due to personal reasons.</li>
      </ul>
    `,
    image: "https://yt3.googleusercontent.com/-s7qozr0Z0ltbuXgfnhHdiVH9ezW4J7OAu46tgagMJxqJ2AJarftCF_x8axYLMlZemElEdXJKa4=s900-c-k-c0x00ffffff-no-rj",
    link: "https://discord.gg/hylex",
    category: "staff"
  },
  {
    title: "Minecraft (4.00M+ Members)",
    description_card: "🌐 The best-selling sandbox game of all time.",
    description: `
      <p>Minecraft is a sandbox game that allows players to explore, build, and survive in a procedurally generated world made of blocks.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Spanish, English, Brazilian Portuguese and European Portuguese, where I translated approximately 3,200 different strings.</li>
      </ul>
    `,
    image: "https://i.redd.it/remake-minecraft-logo-v0-avjal33hpqo61.png?width=512&format=png&auto=webp&s=f633ef8225260cd0a7c835892bb9af40bfe990a0",
    link: "https://discord.gg/minecraft",
    category: "translator"
  },
  {
    title: "Lunar Client (3.2M+ Members)",
    description_card: "🌐 The leading client designed specifically for Minecraft.",
    description: `
      <p>Lunar Client is a modded client for Minecraft that improves performance, adds built-in mods, and provides competitive features for a smoother gameplay experience.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Brazilian Portuguese and European Portuguese, where I translated approximately 2,400 different strings.</li>
      </ul>
    `,
    image: "https://avatars.githubusercontent.com/u/57332930?s=280&v=4",
    link: "https://discord.gg/lunarclient",
    category: "translator"
  },
  {
    title: "Badlion Client (2.6M+ Members)",
    description_card: "🌐 The second leading client designed specifically for Minecraft.",
    description: `
      <p>Badlion Client is a modded client for Minecraft that offers performance improvements, built-in mods, and an integrated anti-cheat system.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Brazilian Portuguese and European Portuguese, where I translated approximately 1,500 different strings.</li>
      </ul>
    `,
    image: "https://avatars.githubusercontent.com/u/11240281?s=280&v=4",
    link: "https://discord.gg/badlion",
    category: "translator"
  },
  {
    title: "Garry's Mod (500.0K+ Members)",
    description_card: "🌐 One of the most influential sandbox games, widely recognized.",
    description: `
      <p>Garry's Mod is a physics-based sandbox game that allows players to manipulate objects, create custom game modes, and experiment freely using tools and community-made content.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Brazilian Portuguese and European Portuguese, where I translated approximately 1,300 different strings.</li>
      </ul>
    `,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Garry%27s_Mod_logo.svg/960px-Garry%27s_Mod_logo.svg.png",
    link: "https://discord.gg/gmod",
    category: "translator"
  },
  {
    title: "Hypixel (480.0K+ Members)",
    description_card: "🌐 The Minecraft server with the highest player count currently.",
    description: `
      <p>Hypixel is one of the largest and most popular servers for Minecraft, known for its wide variety of custom mini-games such as Bed Wars and SkyBlock.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Brazilian Portuguese and European Portuguese, where I translated approximately 920 different strings.</li>
      </ul>
    `,
    image: "https://hypixel.net/styles/hypixel-v2/images/hypixel-512px.png",
    link: "https://discord.gg/hypixel",
    category: "translator"
  },
  {
    title: "Sodium (100.0K+ Members)",
    description_card: "🌐 One of the most widely used performance optimization mods for Minecraft.",
    description: `
      <p>Sodium is a performance optimization mod for Minecraft, designed to significantly improve frame rates and reduce lag.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Brazilian Portuguese and European Portuguese, where I translated approximately 150 different strings.</li>
      </ul>
    `,
    image: "https://pt.minecraft.wiki/images/Sodium_logo.png?23291",
    link: "https://modrinth.com/mod/sodium/versions",
    category: "translator"
  },
  {
    title: "OSU! Web (100.0K+ Members)",
    description_card: "🌐 One of the most widely played rhythm games of all times.",
    description: `
      <p>osu! is a free-to-play rhythm game developed for PC. It focuses on clicking circles, sliding, and spinning on screen in time with music.</p>
      <h4 class="modal-subtitle">🛡️ My Journey</h4>
      <ul>
        <li>I worked as a translator for Brazilian Portuguese and European Portuguese, where I translated approximately 200 different strings.</li>
      </ul>
    `,
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Osulogo.png",
    link: "https://discord.gg/osu",
    category: "translator"
  },
  {
    title: "In progress...",
    description_card: "In progress...",
    description: `<p>In progress...</p>`,
    image: "https://images.vexels.com/media/users/3/152864/isolated/preview/2e095de08301a57890aad6898ad8ba4c-icone-de-ponto-de-interrogacao-do-circulo-amarelo.png",
    link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    category: "programs"
  },
];

const container  = document.getElementById('projects-container');
const modal      = document.getElementById('project-modal');
const modalImg   = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDesc  = document.getElementById('modal-description');
const modalLink  = document.getElementById('modal-link');
const modalTag   = document.getElementById('modal-tag');

function renderProjects(filter) {
  container.innerHTML = '';

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.category === filter);

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:var(--ink3);grid-column:1/-1;padding:40px 0">No projects yet.</p>`;
    return;
  }

  filtered.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.animationDelay = `${i * 0.07}s`;

    const tagMap = { staff: 'Staff', translator: 'Translator', programs: 'Programs' };
    const tag = tagMap[p.category] || p.category;

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
        <div class="card-img-overlay"></div>
      </div>
      <div class="project-info">
        <div>
          <div class="project-tag-pill">${tag}</div>
          <h3>${p.title}</h3>
          <p>${p.description_card}</p>
        </div>
        <button class="btn-project">View Details</button>
      </div>
    `;

    card.addEventListener('click', () => openModal(p, tag));
    container.appendChild(card);
  });

  attachCursorHover();
}

function openModal(p, tag) {
  modalImg.src           = p.image;
  modalImg.alt           = p.title;
  modalTitle.textContent = p.title;
  modalDesc.innerHTML    = p.description;
  modalLink.href         = p.link;
  if (modalTag) modalTag.textContent = tag || '';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelector('.modal-close').addEventListener('click', closeModal);
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.querySelectorAll('.cat-btn, .category').forEach(btn => {
  if (btn.dataset.filter === 'staff') btn.classList.add('active');
  else btn.classList.remove('active');

  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn, .category').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(btn.dataset.filter);
  });
});

renderProjects('staff');

const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navObserver.observe(s));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${i * 0.06}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
}, { passive: true });

(function animateRing() {
  ringX += (mouseX - ringX) * 0.14;
  ringY += (mouseY - ringY) * 0.14;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

function attachCursorHover() {
  document.querySelectorAll('a, button, .project-card, .contact-card, .tag, .sg-pills span, .cat-btn, .category').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
  });
}
attachCursorHover();

document.addEventListener('mouseleave', () => {
  cursorDot.style.opacity  = '0';
  cursorRing.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  cursorDot.style.opacity  = '1';
  cursorRing.style.opacity = '1';
});

document.addEventListener('mousemove', e => {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;
  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');
  if (orb1) orb1.style.transform = `translate(${dx * 20}px, ${dy * 20}px)`;
  if (orb2) orb2.style.transform = `translate(${dx * -12}px, ${dy * -12}px)`;
}, { passive: true });

const heroTitle = document.querySelector('.hero-title');
window.addEventListener('scroll', () => {
  const progress = Math.min(window.scrollY / window.innerHeight, 1);
  if (heroTitle) {
    heroTitle.style.opacity   = 1 - progress * 0.6;
    heroTitle.style.transform = `translateY(${progress * -30}px)`;
  }
}, { passive: true });

const modalStyles = document.createElement('style');
modalStyles.textContent = `
  #modal-description p { margin-bottom: 12px; }
  #modal-description .modal-subtitle {
    font-size: 13px; font-weight: 700; color: var(--ink);
    margin: 16px 0 8px; letter-spacing: 0.01em;
  }
  #modal-description ul {
    padding-left: 18px; display: flex; flex-direction: column; gap: 6px;
  }
  #modal-description ul li {
    font-size: 13px; color: var(--ink3); line-height: 1.65; font-weight: 300;
  }
`;
document.head.appendChild(modalStyles);

const splash    = document.getElementById('splash-screen');
const splashBtn = document.getElementById('splash-btn');
const music     = document.getElementById('bg-music');

document.body.style.overflow = 'hidden';

splashBtn.addEventListener('click', () => {
  music.play();
  splash.classList.add('hidden');
  document.body.style.overflow = '';
});
