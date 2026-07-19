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

const STAT_INVITES = [
  { invite: 'volleyballlegends', label: 'Volleyball Legends' },
  { invite: 'itsatrap',          label: "IT'S A TRAP"        },
  { invite: 'mush',              label: 'Mush'               },
  { invite: 'UKPg88Weeh',        label: 'Decorations for Server' },
  { invite: 'hylex',             label: 'Hylex'              },
];

const ROBLOX_GAMES = [
  { universeId: '6931042565',  label: 'Volleyball Legends' },
  { universeId: '9875383684',  label: 'Be a Brainrot'      },
  { universeId: '10208988072', label: 'Evade Lander'       },
];

const CACHE_KEY_DISCORD = 'xeva_discord_cache';
const CACHE_KEY_ROBLOX  = 'xeva_roblox_cache';

// live data cache
let discordData = [];
let robloxData  = [];

function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {}
}

function loadCache(key, maxAgeMs = 5 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data ?? null;
  } catch (_) {
    return null;
  }
}

function fmtBig(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000)         return Math.round(n / 1_000) + 'K';
  return n.toLocaleString();
}

function fmtMembersShort(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000)     return Math.round(n / 1_000) + 'K';
  return String(n);
}


//
function applyStats(totalMembers, totalServers) {
  const elMembers = document.getElementById('stat-members');
  if (elMembers && !elMembers.dataset.animating) {
    elMembers.innerHTML = fmtMembersShort(totalMembers) + '<em>+</em>';
  }

  const elServers = document.getElementById('stat-servers');
  if (elServers && !elServers.dataset.animating) {
    elServers.innerHTML = totalServers + '<em>+</em>';
  }

  document.querySelectorAll('.hero-stat-members').forEach(el => {
    el.innerHTML = fmtMembersShort(totalMembers) + '<em> +</em>';
  });

  document.querySelectorAll('.skill-float-3').forEach(el => {
    el.textContent = fmtMembersShort(totalMembers) + '+ Members';
  });

  document.querySelectorAll('.hero-stat-servers').forEach(el => {
    el.innerHTML = totalServers + '<em> +</em>';
  });

  document.querySelectorAll('.skill-discord-pill').forEach(el => {
    el.textContent = `Discord — ${fmtMembersShort(totalMembers)}+ Members`;
  });

  updateCardBadges();
}

function animateCount(el, target) {
  el.dataset.animating = '1';
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

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      delete el.dataset.animating;
    }
  }

  requestAnimationFrame(update);
}

function observeStats(totalMembers, totalServers) {
  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statObserver.unobserve(entry.target);
        const el = entry.target;
        if (el.id === 'stat-members') animateCount(el, totalMembers);
        if (el.id === 'stat-servers') animateCount(el, totalServers);
      }
    });
  }, { threshold: 0.3 });

  const elMembers = document.getElementById('stat-members');
  const elServers = document.getElementById('stat-servers');
  if (elMembers) statObserver.observe(elMembers);
  if (elServers) statObserver.observe(elServers);
}

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
  saveCache(CACHE_KEY_DISCORD, results);
  return results;
}

async function fetchRoblox() {
  const ids = ROBLOX_GAMES.map(g => g.universeId).join(',');
  const robloxUrl = `https://games.roblox.com/v1/games?universeIds=${ids}`;

  const proxies = [
    () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(robloxUrl)}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(j => JSON.parse(j.contents)),
    () => fetch(`https://corsproxy.io/?${encodeURIComponent(robloxUrl)}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    () => fetch(`https://api.codetabs.com/v1/proxy?quest=${robloxUrl}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
  ];

  let data = null;

  for (const attempt of proxies) {
    try {
      const result = await Promise.race([
        attempt(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
      ]);
      if (result?.data?.length) {
        data = result;
        break;
      }
    } catch (_) {
    }
  }

  if (!data) {
    const cached = loadCache(CACHE_KEY_ROBLOX, Infinity);
    if (cached) {
      robloxData = cached;
      return cached;
    }
    robloxData = ROBLOX_GAMES.map(g => ({ label: g.label, visits: 0, playing: 0 }));
    return robloxData;
  }

  robloxData = ROBLOX_GAMES.map(g => {
    const match = data.data.find(d => String(d.id) === g.universeId);
    return {
      label:   g.label,
      visits:  match?.visits  ?? 0,
      playing: match?.playing ?? 0,
    };
  });

  saveCache(CACHE_KEY_ROBLOX, robloxData);
  return robloxData;
}

async function loadStats() {
  const cachedDiscord = loadCache(CACHE_KEY_DISCORD);
  const cachedRoblox  = loadCache(CACHE_KEY_ROBLOX);

  if (cachedDiscord) {
    discordData = cachedDiscord;
    const total = discordData.reduce((a, b) => a + b.members, 0);
    applyStats(total, STAT_INVITES.length);
    updatePopovers();
  }

  if (cachedRoblox) {
    robloxData = cachedRoblox;
    updatePopovers();
  }

  if (!cachedDiscord) {
    const elMembers = document.getElementById('stat-members');
    const elServers = document.getElementById('stat-servers');
    if (elMembers) elMembers.innerHTML = '2.5M<em>+</em>';
    if (elServers) elServers.innerHTML = STAT_INVITES.length + '<em>+</em>';
    applyStats(2_500_000, STAT_INVITES.length);
  }

  const [discord, roblox] = await Promise.all([fetchDiscord(), fetchRoblox()]);

  const totalMembers = discord.reduce((a, b) => a + b.members, 0);
  const totalServers = STAT_INVITES.length;

  applyStats(totalMembers, totalServers);
  updatePopovers();

  observeStats(totalMembers, totalServers);
}

// ── Auto refresh a cada 60s ───────────────────────────────────────
async function refreshStats() {
  await Promise.all([fetchDiscord(), fetchRoblox()]);

  const totalMembers = discordData.reduce((a, b) => a + b.members, 0);
  applyStats(totalMembers, STAT_INVITES.length);
  updatePopovers();
}

setInterval(refreshStats, 60_000);

loadStats();

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

  /* ── Card member badge ─────────────────────────────────── */
  .card-member-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 5px 12px 5px 8px;
    border-radius: 100px;
    background: rgba(195, 20, 91, 0.08);
    border: 1px solid rgba(195, 20, 91, 0.18);
    width: fit-content;
    transition: background 0.2s, border-color 0.2s;
  }
  .project-card:hover .card-member-badge {
    background: rgba(195, 20, 91, 0.13);
    border-color: rgba(195, 20, 91, 0.3);
  }
  .card-member-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #c3145b;
    flex-shrink: 0;
    animation: pulseBadge 2s ease infinite;
  }
  .card-member-count {
    font-size: 12px;
    font-weight: 700;
    color: #c3145b;
    letter-spacing: -0.01em;
    line-height: 1;
  }
  .card-member-label {
    font-size: 10px;
    font-weight: 500;
    color: rgba(195, 20, 91, 0.7);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* skeleton shimmer enquanto carrega */
  .card-member-badge.loading .card-member-count {
    display: inline-block;
    width: 40px;
    height: 12px;
    border-radius: 4px;
    background: linear-gradient(90deg, rgba(195,20,91,0.1) 25%, rgba(195,20,91,0.2) 50%, rgba(195,20,91,0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    vertical-align: middle;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* badge de visits para Roblox */
  .card-roblox-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 5px 12px 5px 8px;
    border-radius: 100px;
    background: rgba(10, 10, 10, 0.05);
    border: 1px solid rgba(10, 10, 10, 0.1);
    width: fit-content;
    transition: background 0.2s;
  }
  .project-card:hover .card-roblox-badge {
    background: rgba(10, 10, 10, 0.08);
  }
  .card-roblox-badge svg {
    flex-shrink: 0;
    opacity: 0.5;
  }
  .card-roblox-count {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink2);
    letter-spacing: -0.01em;
    line-height: 1;
  }
  .card-roblox-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--ink3);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;
document.head.appendChild(popoverStyles);

function updatePopovers() {
  const popServers = document.getElementById('pop-servers');
  if (popServers) {
    popServers.innerHTML = STAT_INVITES.map(s => `
      <div class="popover-row">
        <span class="popover-label">${s.label}</span>
        <span class="popover-val">Staff</span>
      </div>
    `).join('');
  }

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

function updateCardBadges() {
  document.querySelectorAll('[data-discord-invite]').forEach(badge => {
    const invite = badge.dataset.discordInvite;
    const entry  = discordData.find(d => {
      const match = STAT_INVITES.find(s => s.invite === invite);
      return match && d.label === match.label;
    });
    const count = entry?.members ?? 0;
    const countEl = badge.querySelector('.card-member-count');
    if (!countEl) return;
    badge.classList.remove('loading');
    if (count > 0) {
      countEl.textContent = fmtBig(count) + '+';
    } else {
      countEl.textContent = '—';
    }
  });

  document.querySelectorAll('[data-roblox-id]').forEach(badge => {
    const universeId = badge.dataset.robloxId;
    const entry = robloxData.find(g => g.universeId === universeId || ROBLOX_GAMES.find(r => r.universeId === universeId && r.label === g.label));
    const visits = entry?.visits ?? 0;
    const countEl = badge.querySelector('.card-roblox-count');
    if (!countEl) return;
    if (visits > 0) {
      countEl.textContent = fmtBig(visits) + '+';
    }
  });
}

// ── Projects ──────────────────────────────────────────────────────
const projects = [
  {
    title: "Volleyball Legends",
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
    category: "staff",
    discordInvite: "volleyballlegends",
  },
  {
    title: "IT'S A TRAP",
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
    category: "staff",
    discordInvite: "itsatrap",
  },
  {
    title: "Mush",
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
    category: "staff",
    discordInvite: "mush",
  },
  {
    title: "Decorations for Server",
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
    category: "staff",
    discordInvite: "UKPg88Weeh",
  },
  {
    title: "Hylex",
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
    category: "staff",
    discordInvite: "hylex",
  },
  {
    title: "Minecraft",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "4M",
  },
  {
    title: "Lunar Client",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "3.2M",
  },
  {
    title: "Badlion Client",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "2.6M",
  },
  {
    title: "Garry's Mod",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "500K",
  },
  {
    title: "Hypixel",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "480K",
  },
  {
    title: "Sodium",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "100K",
  },
  {
    title: "OSU! Web",
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
    category: "translator",
    discordInvite: null,
    staticMembers: "100K",
  },
  {
    title: "In progress...",
    description_card: "In progress...",
    description: `<p>In progress...</p>`,
    image: "https://images.vexels.com/media/users/3/152864/isolated/preview/2e095de08301a57890aad6898ad8ba4c-icone-de-ponto-de-interrogacao-do-circulo-amarelo.png",
    link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    category: "programs",
    discordInvite: null,
  },
];

const container  = document.getElementById('projects-container');
const modal      = document.getElementById('project-modal');
const modalImg   = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDesc  = document.getElementById('modal-description');
const modalLink  = document.getElementById('modal-link');
const modalTag   = document.getElementById('modal-tag');

function buildMemberBadge(p) {
  if (p.discordInvite) {
    return `
      <div class="card-member-badge loading" data-discord-invite="${p.discordInvite}">
        <span class="card-member-dot"></span>
        <span class="card-member-count"></span>
        <span class="card-member-label">members</span>
      </div>`;
  }

  if (p.staticMembers) {
    return `
      <div class="card-member-badge">
        <span class="card-member-dot" style="animation:none;background:#c3145b;opacity:0.5;"></span>
        <span class="card-member-count">${p.staticMembers}+</span>
        <span class="card-member-label">members</span>
      </div>`;
  }

  return '';
}

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

    const memberBadge = buildMemberBadge(p);

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
      <div style="display:flex; flex-direction:column; gap:12px;">
      ${memberBadge}
      <button class="btn-project">View Details</button>
      </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(p, tag));
    container.appendChild(card);
  });

  updateCardBadges();
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

// orb parallax movido para o animation layer (suavizado com lerp)

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


/* ═══════════════════════════════════════════════════════════════════
   ANIMATION LAYER — adicionado sobre o script original
   Não modifica nenhuma funcionalidade existente, apenas estende.
═══════════════════════════════════════════════════════════════════ */

// ── 1. CHAR STAGGER no título hero ────────────────────────────────
(function splitHeroTitle() {
  const nameBig = document.querySelector('.name-big');
  if (!nameBig) return;

  const text = nameBig.textContent;
  nameBig.textContent = '';

  text.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00a0' : char;
    span.style.animationDelay = `${0.28 + i * 0.08}s`;
    nameBig.appendChild(span);
  });
})();

// ── 2. RIPPLE nos botões ───────────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-primary, .btn-ghost, .btn-nav, #splash-btn');
  if (!btn) return;

  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 1.6;
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);

  ripple.addEventListener('animationend', () => ripple.remove());
}, { passive: true });

// ── 3. STAGGER nos filhos de seções ───────────────────────────────
(function setupStagger() {
  const targets = [
    '.stats-cards',
    '.contact-row',
    '.about-tags',
    '.hero-actions',
    '.sg-pills',
    '.project-categories',
  ];

  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('stagger-children');
    });
  });

  const staggerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.stagger-children').forEach(el => {
    staggerObserver.observe(el);
  });
})();

// ── 4. SCROLL REVEAL com direções alternadas ──────────────────────
(function setupDirectionalReveals() {
  const leftSide  = document.querySelector('.about-left');
  const rightSide = document.querySelector('.about-right');
  if (leftSide)  leftSide.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('from-left'));
  if (rightSide) rightSide.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('from-right'));
})();

// ── 5. PARALLAX leve nas orbs do hero ─────────────────────────────
(function smoothOrbs() {
  let orbTargetX = 0, orbTargetY = 0;
  let orbCurrentX = 0, orbCurrentY = 0;

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    orbTargetX = (e.clientX - cx) / cx;
    orbTargetY = (e.clientY - cy) / cy;
  }, { passive: true });

  (function animateOrbs() {
    orbCurrentX += (orbTargetX - orbCurrentX) * 0.05;
    orbCurrentY += (orbTargetY - orbCurrentY) * 0.05;

    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    const orb3 = document.querySelector('.orb-3');
    if (orb1) orb1.style.transform = `translate(${orbCurrentX * 28}px, ${orbCurrentY * 28}px)`;
    if (orb2) orb2.style.transform = `translate(${orbCurrentX * -16}px, ${orbCurrentY * -16}px)`;
    if (orb3) orb3.style.transform = `translate(${orbCurrentX * 12}px, ${orbCurrentY * -12}px)`;

    requestAnimationFrame(animateOrbs);
  })();
})();

// ── 6. TILT 3D suave nos project cards ────────────────────────────
(function setupCardTilt() {
  function applyTilt(card) {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotateX = dy * -4;
      const rotateY = dx *  4;

      card.style.transform = `translateY(-10px) scale(1.012) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.transition = 'transform 0.1s ease, box-shadow 0.45s, border-color 0.35s';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = '';
    });
  }

  function attachTiltToCards() {
    document.querySelectorAll('.project-card').forEach(card => {
      if (card.dataset.tilt) return;
      card.dataset.tilt = '1';
      card.style.transformStyle = 'preserve-3d';
      applyTilt(card);
    });
  }

  attachTiltToCards();

  const projectsContainer = document.getElementById('projects-container');
  if (projectsContainer) {
    new MutationObserver(attachTiltToCards).observe(projectsContainer, { childList: true });
  }
})();

// ── 7. CURSOR — rastro magnético nos elementos interativos ─────────
(function enhanceCursor() {
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  document.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, .project-card, .contact-card, .stat-card, .tag, .sg-pills span');
    if (!target) return;
    ring.style.transition = 'left 0.3s cubic-bezier(0.34,1.56,0.64,1), top 0.3s cubic-bezier(0.34,1.56,0.64,1), width 0.25s, height 0.25s, border-color 0.25s';
  });

  document.addEventListener('mouseout', e => {
    const target = e.target.closest('a, button, .project-card, .contact-card, .stat-card, .tag');
    if (!target) return;
    ring.style.transition = '';
  });
})();

// ── 8. NÚMERO contador no hero stat de membros ────────────────────
(function heroStatCount() {
  const heroMembersEl = document.querySelector('.hero-stat-members');
  if (!heroMembersEl) return;

  setTimeout(() => {
    const raw = heroMembersEl.textContent.replace(/[^0-9.MKB]/g, '');
    let target = 2_500_000;

    if (raw.includes('M')) target = parseFloat(raw) * 1_000_000;
    else if (raw.includes('K')) target = parseFloat(raw) * 1_000;
    else if (!isNaN(parseFloat(raw))) target = parseFloat(raw);

    const duration = 1600;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(ease * target);
      heroMembersEl.innerHTML = (current / 1_000_000).toFixed(1).replace('.0', '') + 'M<em> +</em>';
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }, 900);
})();