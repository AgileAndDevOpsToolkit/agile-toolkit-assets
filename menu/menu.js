// menu.js
(() => {
  const DEFAULTS = {
    logoUrl: new URL("./assets/logo_fondblanc_800.png", document.currentScript?.src || location.href).toString(),
    position: { top: 16, left: 16 },
    maxHeight: 360,
    zIndex: 99999,
    title: "Tous les outils Agile Toolkit",
  };

  const tools = Array.isArray(window.AGILE_TOOLKIT_TOOLS) ? window.AGILE_TOOLKIT_TOOLS : [];

  // Host container
  const host = document.createElement("div");
  host.id = "agile-toolkit-menu-host";
  host.style.position = "fixed";
  host.style.top = `${DEFAULTS.position.top}px`;
  host.style.left = `${DEFAULTS.position.left}px`;
  host.style.zIndex = String(DEFAULTS.zIndex);

  // Shadow DOM to avoid CSS collisions
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .atk-wrap {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      position: relative;
    }
    .atk-btn {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      border: 1px solid rgba(0,0,0,0.10);
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(6px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      display: grid;
      place-items: center;
      cursor: pointer;
      padding: 0;
    }
    .atk-btn:focus-visible {
      outline: 3px solid rgba(0,0,0,0.25);
      outline-offset: 3px;
    }
    .atk-logo {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: block;
      object-fit: contain;
    }

    .atk-panel {
      position: absolute;
      top: 60px;
      left: 0;
      min-width: 280px;
      max-width: min(360px, calc(100vw - 32px));
      max-height: ${DEFAULTS.maxHeight}px;
      overflow: auto;
      border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.10);
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(10px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.18);
      padding: 10px;
      display: none;
    }
    .atk-panel.open { display: block; }

    .atk-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px 10px 8px;
    }
    .atk-title {
      font-size: 14px;
      font-weight: 700;
      color: rgba(0,0,0,0.80);
    }
    .atk-close {
      border: 0;
      background: transparent;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 6px 8px;
      border-radius: 10px;
      color: rgba(0,0,0,0.55);
    }
    .atk-close:hover { background: rgba(0,0,0,0.06); }

    .atk-list { display: grid; gap: 6px; padding: 0 6px 6px 6px; }
    .atk-item {
      display: block;
      text-decoration: none;
      padding: 10px 10px;
      border-radius: 12px;
      color: rgba(0,0,0,0.82);
      background: rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.06);
      font-size: 14px;
      font-weight: 600;
    }
    .atk-item:hover { background: rgba(0,0,0,0.06); }
    .atk-item.active { background: rgba(0,0,0,0.10); }

    .atk-empty {
      padding: 10px 12px;
      color: rgba(0,0,0,0.55);
      font-size: 13px;
    }
  `;

  const wrap = document.createElement("div");
  wrap.className = "atk-wrap";

  const btn = document.createElement("button");
  btn.className = "atk-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", `${DEFAULTS.title} menu`);
  btn.setAttribute("aria-expanded", "false");

  const img = document.createElement("img");
  img.className = "atk-logo";
  img.alt = DEFAULTS.title;
  img.src = DEFAULTS.logoUrl;

  const panel = document.createElement("div");
  panel.className = "atk-panel";
  panel.setAttribute("role", "menu");

  const head = document.createElement("div");
  head.className = "atk-head";

  const title = document.createElement("div");
  title.className = "atk-title";
  title.textContent = DEFAULTS.title;

  const close = document.createElement("button");
  close.className = "atk-close";
  close.type = "button";
  close.setAttribute("aria-label", "Fermer");
  close.textContent = "×";

  head.appendChild(title);
  head.appendChild(close);

  const list = document.createElement("div");
  list.className = "atk-list";

  const current = location.href;

  if (tools.length === 0) {
    const empty = document.createElement("div");
    empty.className = "atk-empty";
    empty.textContent = "Aucun lien configuré. Renseigne tools.js (AGILE_TOOLKIT_TOOLS).";
    panel.appendChild(head);
    panel.appendChild(empty);
  } else {
    for (const t of tools) {
      const a = document.createElement("a");
      a.className = "atk-item";
      a.href = t.url;
      a.textContent = t.title;
      a.setAttribute("role", "menuitem");

      // Open ONLY YouTube in a new tab
      let isYouTube = false;
      try {
        const u = new URL(t.url, location.href);
        isYouTube = /(^|\.)youtube\.com$/i.test(u.hostname) || /^youtu\.be$/i.test(u.hostname);
      } catch {}

      if (isYouTube) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else {
        a.target = "_self";
      }

      // Active state (simple)
      try {
        const tu = new URL(t.url, location.href).toString();
        if (current.startsWith(tu) || tu.startsWith(current)) a.classList.add("active");
      } catch {}
      list.appendChild(a);
    }
    panel.appendChild(head);
    panel.appendChild(list);
  }

  const setOpen = (open) => {
    panel.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const toggle = () => setOpen(!panel.classList.contains("open"));

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  close.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(false);
  });

  // click outside closes
  document.addEventListener("click", () => setOpen(false));

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Prevent inside clicks from bubbling to document
  panel.addEventListener("click", (e) => e.stopPropagation());

  btn.appendChild(img);
  wrap.appendChild(btn);
  wrap.appendChild(panel);

  shadow.appendChild(style);
  shadow.appendChild(wrap);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(host);
  });
})();
