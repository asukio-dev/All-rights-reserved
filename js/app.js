const $ = (s) => document.querySelector(s);

const DISCORD_CONTACT_URL = "https://discord.gg/TON_INVITE_YUFU"; // <-- remplace ici

const state = {
  all: [],
  filtered: [],
  sort: "recent",
  q: ""
};

function iconDiscord() {
  // mini icône discord en SVG (pas besoin d'assets)
  return `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.2 5.6A16.2 16.2 0 0 0 16.3 4c-.2.4-.4.9-.6 1.3a15 15 0 0 0-4.4 0c-.2-.4-.4-.9-.6-1.3A16.2 16.2 0 0 0 6.8 5.6C4.3 9.2 3.6 12.8 4 16.4c1.7 1.2 3.3 2 5 2.5.4-.5.7-1 .9-1.6-.6-.2-1.1-.5-1.6-.8l.4-.3c3.2 1.5 6.7 1.5 9.8 0l.4.3c-.5.3-1 .6-1.6.8.2.6.5 1.1.9 1.6 1.7-.5 3.3-1.3 5-2.5.5-4.1-.8-7.6-2.9-10.8Z" stroke="rgba(233,238,252,.85)" stroke-width="1.2"/>
    <path d="M9.3 14.2c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4c.8 0 1.4.6 1.4 1.4s-.6 1.4-1.4 1.4Zm5.4 0c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4c.8 0 1.4.6 1.4 1.4s-.6 1.4-1.4 1.4Z" fill="rgba(233,238,252,.85)"/>
  </svg>`;
}

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderCards() {
  const wrap = $("#cards");
  const empty = $("#empty");
  wrap.innerHTML = "";

  if (!state.filtered.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  for (const item of state.filtered) {
    const notes = (item.notes || []).slice(0, 3).map(n => `<span class="pill">${escapeHtml(n)}</span>`).join("");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="badgeOK">AUTORISÉ</div>

      <div class="card__top">
        <img class="serverLogo" src="${escapeHtml(item.serverLogo)}" alt="Logo serveur" onerror="this.src='assets/placeholder.png'">
        <div style="min-width:0">
          <h3 class="card__title">${escapeHtml(item.serverName)}</h3>
          <div class="card__meta">${escapeHtml(item.serverTag || "")}</div>
        </div>
      </div>

      <div class="pills">${notes}</div>

      <div class="card__bottom">
        <div class="founder">
          <img src="${escapeHtml(item.founderAvatar)}" alt="Avatar fondateur" onerror="this.src='assets/placeholder.png'">
          <div style="min-width:0">
            <div class="founder__name">${escapeHtml(item.founderName)}</div>
            <div class="founder__tag">${escapeHtml(item.founderTag || "")}</div>
          </div>
        </div>

        <div class="links">
          <a class="iconbtn" href="${escapeHtml(item.discordInvite)}" target="_blank" rel="noopener noreferrer" title="Ouvrir le Discord">
            ${iconDiscord()}
          </a>
        </div>
      </div>
    `;
    wrap.appendChild(card);
  }
}

function applyFilterSort() {
  const q = state.q.trim().toLowerCase();

  let list = [...state.all];
  if (q) {
    list = list.filter(x => {
      const hay = [
        x.serverName, x.serverTag, x.founderName, x.founderTag,
        ...(x.notes || [])
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  if (state.sort === "alpha") {
    list.sort((a,b) => (a.serverName || "").localeCompare(b.serverName || "", "fr"));
  } else {
    // recent
    list.sort((a,b) => new Date(b.authorizedSince || 0) - new Date(a.authorizedSince || 0));
  }

  state.filtered = list;
  renderCards();
}

async function loadData() {
  const res = await fetch("data/authorized.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Impossible de charger data/authorized.json");
  const data = await res.json();

  state.all = Array.isArray(data.entries) ? data.entries : [];
  state.filtered = [...state.all];

  $("#statCount").textContent = String(state.all.length);
  $("#statUpdated").textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleDateString("fr-FR") : "—";

  applyFilterSort();
}

function initUI() {
  $("#year").textContent = String(new Date().getFullYear());
  $("#contactBtn").setAttribute("href", DISCORD_CONTACT_URL);

  $("#search").addEventListener("input", (e) => {
    state.q = e.target.value;
    applyFilterSort();
  });

  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    applyFilterSort();
  });
}

/* ===== Animated background (canvas) ===== */
function initBackground() {
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const stars = [];
  const blobs = [];

  function resize() {
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars.length = 0;
    const n = Math.floor((w * h) / 22000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.7 + 0.15,
        s: Math.random() * 0.35 + 0.08
      });
    }

    blobs.length = 0;
    const b = 4;
    for (let i = 0; i < b; i++) {
      blobs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() * 2 - 1) * 0.18,
        vy: (Math.random() * 2 - 1) * 0.18,
        r: Math.random() * 320 + 260,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  let mx = 0.5, my = 0.5;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
  }, { passive: true });

  function draw(t) {
    const time = t * 0.001;
    ctx.clearRect(0, 0, w, h);

    // soft background haze
    const g = ctx.createRadialGradient(w*0.2, h*0.2, 0, w*0.2, h*0.2, Math.max(w,h));
    g.addColorStop(0, "rgba(160,140,255,0.10)");
    g.addColorStop(0.35, "rgba(60,200,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // moving blobs (parallax)
    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;

      const px = (mx - 0.5) * 60;
      const py = (my - 0.5) * 60;
      const x = b.x + px * 0.35;
      const y = b.y + py * 0.35;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      const hueShift = Math.sin(time + b.phase) * 0.06;
      grad.addColorStop(0, `rgba(${Math.floor(170+35*hueShift)}, ${Math.floor(120+80*hueShift)}, 255, 0.14)`);
      grad.addColorStop(0.55, "rgba(60,200,255,0.06)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // stars
    ctx.fillStyle = "rgba(233,238,252,0.85)";
    for (const s of stars) {
      const tw = (Math.sin(time * 2 + s.x * 0.01) * 0.5 + 0.5) * 0.35;
      ctx.globalAlpha = Math.max(0, Math.min(1, s.a + tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.s;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(draw);
}

(async function main(){
  initUI();
  initBackground();
  try {
    await loadData();
  } catch (err) {
    console.error(err);
    $("#statCount").textContent = "—";
    $("#statUpdated").textContent = "—";
    $("#cards").innerHTML = `
      <div class="empty">
        <div class="empty__title">Erreur de chargement</div>
        <div class="empty__text">Vérifie que <code>data/authorized.json</code> existe et est bien publié sur GitHub Pages.</div>
      </div>
    `;
  }
})();
