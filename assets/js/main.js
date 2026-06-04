(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.remove("no-js");

  const root = document.documentElement;
  const storedTheme = localStorage.getItem("johnbampton-theme");
  if (storedTheme) root.setAttribute("data-theme", storedTheme);
  else root.setAttribute("data-theme", "dark");

  function toggleTheme() {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("johnbampton-theme", next);
    toast(`theme → ${next}`);
  }
  $$("[data-action='theme']").forEach((b) => b.addEventListener("click", toggleTheme));

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  const nav = $("#nav");
  const navToggle = $("#nav-toggle");
  if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
  }

  if (localStorage.getItem("johnbampton-scanlines") === "off") {
    $(".scanlines")?.classList.add("off");
  }

  const bootEl = $("#boot");
  if (bootEl && !reduceMotion) {
    const lines = $$(".boot-line", bootEl);
    let i = 0;
    const step = () => {
      if (i < lines.length) {
        lines[i].classList.add("show");
        i++;
        setTimeout(step, 130 + Math.random() * 120);
      } else {
        startTyping();
      }
    };
    setTimeout(step, 300);
  } else if (bootEl) {
    $$(".boot-line", bootEl).forEach((l) => l.classList.add("show"));
    startTyping();
  }

  function startTyping() {
    const target = $("#typed");
    if (!target) return;
    const words = JSON.parse(target.dataset.words || "[]");
    if (!words.length) return;
    let w = 0, c = 0, deleting = false;
    const tick = () => {
      const word = words[w];
      target.textContent = deleting ? word.slice(0, c--) : word.slice(0, c++);
      let delay = deleting ? 45 : 90;
      if (!deleting && c > word.length) { deleting = true; delay = 1400; }
      else if (deleting && c < 0) { deleting = false; w = (w + 1) % words.length; c = 0; delay = 350; }
      setTimeout(tick, delay);
    };
    if (reduceMotion) { target.textContent = words[0]; return; }
    tick();
  }

  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animateCount(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => io.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = formatNum(+c.dataset.count, c.dataset.suffix)));
  }
  function animateCount(el) {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = formatNum(end, suffix); return; }
    const dur = 1400; const start = performance.now();
    const run = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.floor(end * eased), suffix);
      if (p < 1) requestAnimationFrame(run);
      else el.textContent = formatNum(end, suffix);
    };
    requestAnimationFrame(run);
  }
  function formatNum(n, suffix) {
    return n.toLocaleString("en-US") + (suffix || "");
  }

  const reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((r) => io.observe(r));
  } else {
    reveals.forEach((r) => r.classList.add("in"));
  }

  const repoMount = $("#repo-grid");
  if (repoMount) {
    fetch("https://api.github.com/users/jbampton/repos?sort=stars&per_page=100&type=owner")
      .then((r) => { if (!r.ok) throw new Error("gh " + r.status); return r.json(); })
      .then((repos) => {
        if (!Array.isArray(repos) || !repos.length) throw new Error("empty");
        const top = repos
          .filter((r) => !r.fork)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6);
        repoMount.innerHTML = top.map(repoCard).join("");
      })
      .catch(() => {
        const note = $("#repo-note");
        if (note) note.textContent = "// showing curated highlights (live API unavailable)";
      });
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])); }
  function repoCard(r) {
    return `<article class="repo reveal in">
      <div class="repo__top"><span class="lang-dot"></span>
        <a class="repo__name" href="${esc(r.html_url)}" target="_blank" rel="noopener">${esc(r.name)}</a></div>
      <p class="repo__desc">${esc(r.description || "No description provided.")}</p>
      <div class="repo__meta">
        <span>★ ${r.stargazers_count.toLocaleString()}</span>
        <span>⑂ ${r.forks_count.toLocaleString()}</span>
        ${r.language ? `<span><i class="lang-dot"></i>${esc(r.language)}</span>` : ""}
      </div>
    </article>`;
  }

  const heat = $("#heatmap");
  if (heat) {
    let html = "";
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let k = 0; k < 30 * 7; k++) {
      const v = rand();
      const lvl = v > 0.82 ? 4 : v > 0.62 ? 3 : v > 0.40 ? 2 : v > 0.22 ? 1 : 0;
      html += `<i data-l="${lvl}"></i>`;
    }
    heat.innerHTML = html;
  }

  const COMMANDS = [
    { ic: "▸", label: "Go: Home",        sub: "g h", run: () => go("index.html") },
    { ic: "▸", label: "Go: About",       sub: "g a", run: () => go("about.html") },
    { ic: "▸", label: "Go: Projects",    sub: "g p", run: () => go("projects.html") },
    { ic: "#", label: "Jump: Open Source", sub: "section", run: () => jump("#opensource") },
    { ic: "#", label: "Jump: Contact",     sub: "section", run: () => jump("#contact") },
    { ic: "◑", label: "Toggle theme",    sub: "dark/light", run: toggleTheme },
    { ic: "▮", label: "Toggle scanlines", sub: "CRT", run: toggleScanlines },
    { ic: "_", label: "Open terminal",   sub: "`", run: () => openTerminal() },
    { ic: "ⓘ", label: "About this system", sub: "", run: () => openModal() },
    { ic: "↗", label: "GitHub: @jbampton", sub: "extern", run: () => open("https://github.com/jbampton") },
    { ic: "↗", label: "Email John Bampton",   sub: "extern", run: () => open("mailto:jbampton@gmail.com") },
    { ic: "↗", label: "Download CV",      sub: "extern", run: () => open("data/cv.html") },
  ];

  const pOverlay = $("#palette-overlay");
  const pInput = $("#palette-input");
  const pList = $("#palette-list");
  let pActive = 0, pFiltered = COMMANDS;

  function openPalette() {
    if (!pOverlay) return;
    pOverlay.classList.add("open");
    pInput.value = ""; renderPalette(COMMANDS); pInput.focus();
  }
  function closePalette() { pOverlay && pOverlay.classList.remove("open"); }
  function renderPalette(items) {
    pFiltered = items; pActive = 0;
    if (!items.length) { pList.innerHTML = `<div class="palette__empty">no matching command</div>`; return; }
    pList.innerHTML = items.map((c, idx) =>
      `<button class="palette__item ${idx === 0 ? "active" : ""}" data-idx="${idx}">
        <span class="pi-ic">${c.ic}</span><span>${c.label}</span><span class="pi-sub">${c.sub}</span></button>`).join("");
    $$(".palette__item", pList).forEach((el) => {
      el.addEventListener("click", () => { pFiltered[+el.dataset.idx].run(); closePalette(); });
      el.addEventListener("mousemove", () => setActive(+el.dataset.idx));
    });
  }
  function setActive(idx) {
    pActive = idx;
    $$(".palette__item", pList).forEach((el, i) => el.classList.toggle("active", i === idx));
  }
  if (pInput) {
    pInput.addEventListener("input", () => {
      const q = pInput.value.toLowerCase().trim();
      renderPalette(q ? COMMANDS.filter((c) => (c.label + c.sub).toLowerCase().includes(q)) : COMMANDS);
    });
    pInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(pActive + 1, pFiltered.length - 1)); scrollActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(pActive - 1, 0)); scrollActive(); }
      else if (e.key === "Enter") { e.preventDefault(); pFiltered[pActive] && (pFiltered[pActive].run(), closePalette()); }
      else if (e.key === "Escape") closePalette();
    });
  }
  function scrollActive() { $$(".palette__item", pList)[pActive]?.scrollIntoView({ block: "nearest" }); }
  $$("[data-action='palette']").forEach((b) => b.addEventListener("click", openPalette));
  pOverlay && pOverlay.addEventListener("click", (e) => { if (e.target === pOverlay) closePalette(); });

  function go(url) { window.location.href = url; }
  function jump(hash) {
    const el = $(hash);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    else go("index.html" + hash);
  }
  function open(url) { window.open(url, url.startsWith("http") ? "_blank" : "_self", "noopener"); }
  function toggleScanlines() {
    const sl = $(".scanlines"); if (!sl) return;
    const off = sl.classList.toggle("off");
    localStorage.setItem("johnbampton-scanlines", off ? "off" : "on");
    toast(`scanlines → ${off ? "off" : "on"}`);
  }

  const tOverlay = $("#terminal-overlay");
  const tOut = $("#terminal-out");
  const tInput = $("#terminal-input");
  const history = []; let hIdx = -1;

  function openTerminal() {
    if (!tOverlay) { go("index.html"); return; }
    tOverlay.classList.add("open");
    tInput.focus();
    if (!tOut.dataset.init) { printRes("Type <span class='hl'>help</span> to list commands. <span class='hl'>exit</span> to close."); tOut.dataset.init = "1"; }
  }
  function closeTerminal() { tOverlay && tOverlay.classList.remove("open"); }
  $$("[data-action='terminal']").forEach((b) => b.addEventListener("click", () => openTerminal()));
  tOverlay && tOverlay.addEventListener("click", (e) => { if (e.target === tOverlay) closeTerminal(); });

  const TCMDS = {
    help: () => `available commands:
  <span class='hl'>about</span>      who is John Bampton
  <span class='hl'>projects</span>   open-source projects
  <span class='hl'>social</span>     links & handles
  <span class='hl'>contact</span>    how to reach me
  <span class='hl'>resume</span>     open full CV
  <span class='hl'>theme</span>      toggle dark/light
  <span class='hl'>matrix</span>     enter the matrix
  <span class='hl'>whoami</span> · <span class='hl'>date</span> · <span class='hl'>clear</span> · <span class='hl'>exit</span>`,
    about: () => `John Bampton - "John Bampton".
Event Host and Manager · Apache Software Foundation Committer · Open-Source Maintainer.
25+ years building successful communities and platforms.`,
    skills: () => `languages : JavaScript, Python, PHP, Ruby, Shell
backend   : Laravel, Express, NestJS, Gin/Fiber, Flask, Rails
frontend  : React, Next.js, Vue, Nuxt, Tailwind
data      : PostgreSQL, MySQL, MongoDB, Redis, ClickHouse, Elastic
systems   : Linux, Docker, Nginx, CI/CD, GitHub Actions`,
    projects: () => `→ ONE Language        system programming language & compiler
→ Donya OS            Linux distro + package manager
type 'open projects' or visit <a href='projects.html'>projects.html</a>`,
    experience: () => `2023–now  Apache Software Foundation Committer (Brisbane)
2024-2025  Manager and Events Host at Not-for-profit Corporation
2024-2025  Events Host for local community club
2021–now  Maintainer @ NextCommunity
2020–now  Open-Source Contributor for mruby programming language`,
    social: () => `github : <a href='https://github.com/jbampton' target='_blank' rel='noopener'>@jbampton</a>`,
    contact: () => `email : <a href='mailto:jbampton@gmail.com'>jbampton@gmail.com</a>`,
    resume: () => { open("data/cv.html"); return "opening full CV…"; },
    whoami: () => "john",
    date: () => new Date().toString(),
    theme: () => { toggleTheme(); return "theme toggled."; },
    matrix: () => { toggleMatrix(true); return "wake up, Neo… (press ESC to exit)"; },
    sudo: () => "nice try. you already have root here. 🔓",
    ls: () => "about.html index.html projects.html robots.txt sitemap.xml data/ assets/",
    pwd: () => "/home/john/site",
    hire: () => "📬 jbampton@gmail.com - let's build something exceptional.",
    clear: () => { tOut.innerHTML = ""; return ""; },
    exit: () => { closeTerminal(); return ""; },
  };

  function printEcho(cmd) {
    const div = document.createElement("div");
    div.className = "echo";
    div.innerHTML = `<span class="you">john@bampton</span>:<span style="color:var(--purple)">~</span>$ ${esc(cmd)}`;
    tOut.appendChild(div);
  }
  function printRes(html) {
    if (!html) return;
    const div = document.createElement("div");
    div.className = "res"; div.innerHTML = html;
    tOut.appendChild(div);
  }
  function runTerminal(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    printEcho(cmd);
    history.unshift(cmd); hIdx = -1;
    const [name, arg] = cmd.toLowerCase().split(/\s+/);
    if (name === "open" && arg) { open(arg.includes(".") ? arg : arg + ".html"); printRes(`opening ${esc(arg)}…`); }
    else if (TCMDS[name]) printRes(TCMDS[name]());
    else printRes(`command not found: <span class='hl'>${esc(name)}</span> - try <span class='hl'>help</span>`);
    tOut.scrollTop = tOut.scrollHeight;
  }
  if (tInput) {
    tInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { runTerminal(tInput.value); tInput.value = ""; }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hIdx < history.length - 1) tInput.value = history[++hIdx] || ""; }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (hIdx > 0) tInput.value = history[--hIdx] || ""; else { hIdx = -1; tInput.value = ""; } }
      else if (e.key === "Escape") closeTerminal();
    });
  }

  const modal = $("#sys-modal");
  function openModal() {
    if (!modal) return;
    modal.classList.add("open");
    const upEl = $("#sys-uptime");
    if (upEl) {
      const start = performance.timing ? performance.timing.navigationStart : Date.now();
      const t = ((Date.now() - start) / 1000).toFixed(1);
      upEl.textContent = t + "s";
    }
    const dpr = $("#sys-dpr"); if (dpr) dpr.textContent = (window.devicePixelRatio || 1) + "x";
    const vp = $("#sys-vp"); if (vp) vp.textContent = `${window.innerWidth}×${window.innerHeight}`;
    const cores = $("#sys-cores"); if (cores) cores.textContent = (navigator.hardwareConcurrency || "?") + " threads";
  }
  function closeModal() { modal && modal.classList.remove("open"); }
  $$("[data-action='about-system']").forEach((b) => b.addEventListener("click", openModal));
  $$("[data-action='close-modal']").forEach((b) => b.addEventListener("click", closeModal));
  modal && modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let kSeq = [];
  window.addEventListener("keydown", (e) => {
    kSeq.push(e.key);
    kSeq = kSeq.slice(-KONAMI.length);
    if (kSeq.join(",") === KONAMI.join(",")) { toggleMatrix(true); toast("⬢ KONAMI - entering the matrix"); }
  });

  let matrixCanvas, matrixRAF;
  function toggleMatrix(on) {
    if (on) {
      if (!matrixCanvas) buildMatrix();
      matrixCanvas.classList.add("on");
      runMatrix();
    } else if (matrixCanvas) {
      matrixCanvas.classList.remove("on");
      cancelAnimationFrame(matrixRAF);
    }
  }
  function buildMatrix() {
    matrixCanvas = document.createElement("canvas");
    matrixCanvas.id = "matrix-canvas";
    document.body.appendChild(matrixCanvas);
  }
  function runMatrix() {
    const c = matrixCanvas, ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    const chars = "01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜｵﾘ$+*JOHNBAMPTON</>{}".split("");
    const fs = 16, cols = Math.floor(c.width / fs);
    const drops = new Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = "rgba(5,8,13,0.08)"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#00ff9c"; ctx.font = fs + "px monospace";
      for (let i = 0; i < drops.length; i++) {
        const txt = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(txt, i * fs, drops[i] * fs);
        if (drops[i] * fs > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      matrixRAF = requestAnimationFrame(draw);
    };
    draw();
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMatrix(false); });
  window.addEventListener("resize", () => { if (matrixCanvas && matrixCanvas.classList.contains("on")) { matrixCanvas.width = innerWidth; matrixCanvas.height = innerHeight; } });

  const art = [
    "%c",
    "┏┳  ┓     ┳┓            ",
    " ┃┏┓┣┓┏┓  ┣┫┏┓┏┳┓┏┓╋┏┓┏┓",
    "┗┛┗┛┛┗┛┗  ┻┛┗┻┛┗┗┣┛┗┗┛┛┗",
    "                 ┛      ",
    "",
    " You found the console. Curious — I like that.",
    " Try the terminal (press ` ) and type 'hire'.",
    " — John Bampton",
  ].join("\n");

  try {
    console.log(art, "color:#00ff9c;font-family:monospace;font-size:12px");
  } catch (_) {}

  let gPending = false, gTimer;
  window.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
    if (e.key === "`" && !typing) { e.preventDefault(); openTerminal(); return; }
    if (typing) return;
    if (e.key === "?") { openPalette(); return; }
    if (e.key.toLowerCase() === "g") { gPending = true; clearTimeout(gTimer); gTimer = setTimeout(() => (gPending = false), 800); return; }
    if (gPending) {
      gPending = false;
      const map = { h: "index.html", a: "about.html", p: "projects.html" };
      if (map[e.key.toLowerCase()]) go(map[e.key.toLowerCase()]);
    }
  });

  let toastTimer;
  function toast(msg) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  window.johnbampton = { terminal: openTerminal, palette: openPalette, matrix: () => toggleMatrix(true), theme: toggleTheme };
})();
