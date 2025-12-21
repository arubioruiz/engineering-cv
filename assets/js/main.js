(function () {
  "use strict";

  /* =========================
     HELPERS
     ========================= */

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  /* =========================
     PUBLICATIONS (RESEARCH)
     ========================= */

  function renderPublications(publications, container) {
    container.innerHTML = "";

    publications
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .forEach(p => {
        const li = document.createElement("li");
        li.className = "publication";

        const doiLink = p.url
          ? ` · <a href="${p.url}" target="_blank" rel="noopener noreferrer">DOI</a>`
          : "";

        li.innerHTML = `
          <div class="publication__title">${p.title}</div>
          <div class="publication__authors">${p.authors.join(", ")}</div>
          <div class="publication__meta">
            <em>${p.venue}, ${p.year}</em>${doiLink}
          </div>
        `;

        container.appendChild(li);
      });
  }

  async function renderResearchStats() {
    const container = document.getElementById("research-stats");
    if (!container) return;

    const publications = await loadJSON("/data/publications.json");

    const byType = publications.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {});

    container.innerHTML = "";

    const totalCard = document.createElement("div");
    totalCard.className = "card";
    totalCard.innerHTML = `<h3>Total Publications</h3><p><strong>${publications.length}</strong></p>`;
    container.appendChild(totalCard);

    Object.entries(byType).forEach(([type, count]) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <p><strong>${count}</strong></p>
      `;
      container.appendChild(card);
    });
  }

  async function renderTopicsGrid() {
    const grid = document.getElementById("topics-grid");
    if (!grid) return;

    const [topics, publications] = await Promise.all([
      loadJSON("/data/topics.json"),
      loadJSON("/data/publications.json")
    ]);

    grid.innerHTML = "";

    topics.forEach(topic => {
      const count = publications.filter(
        p => p.topics && p.topics.includes(topic.id)
      ).length;

      const card = document.createElement("div");
      card.className = "card";
      card.style.cursor = "pointer";

      card.innerHTML = `
        <h3>${topic.label}</h3>
        <p>${topic.description}</p>
        <span class="nav-btn">${count} publications</span>
      `;

      card.addEventListener("click", () => {
        window.location.hash = topic.id;
        document
          .querySelector("[data-publication-list]")
          ?.scrollIntoView({ behavior: "smooth" });
      });

      grid.appendChild(card);
    });
  }

  async function renderFullPublications() {
    const listEl = document.querySelector("[data-publication-list]");
    const titleEl = document.getElementById("publications-title");
    if (!listEl || !titleEl) return;

    const [publications, topics] = await Promise.all([
      loadJSON("/data/publications.json"),
      loadJSON("/data/topics.json")
    ]);

    const topicMap = Object.fromEntries(topics.map(t => [t.id, t.label]));

    function applyFilter() {
      const hash = window.location.hash.replace("#", "");

      let filtered = publications;

      if (hash && topicMap[hash]) {
        filtered = publications.filter(
          p => p.topics && p.topics.includes(hash)
        );
        titleEl.textContent = `Publications in the field of ${topicMap[hash]}`;
      } else {
        titleEl.textContent = "Publications";
      }

      renderPublications(filtered, listEl);
    }

    applyFilter();
    window.addEventListener("hashchange", applyFilter);
  }

  /* =========================
     INDUSTRY
     ========================= */

  async function renderIndustryGrid() {
    const grid = document.getElementById("industry-grid");
    if (!grid) return;

    const fields = await loadJSON("/data/industry_fields.json");
    grid.innerHTML = "";

    fields.forEach(field => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${field.label}</h3>
        <p>${field.short}</p>
        <span class="nav-btn">View details ↓</span>
      `;

      card.addEventListener("click", () => {
        document.getElementById(field.id)?.scrollIntoView({ behavior: "smooth" });
      });

      grid.appendChild(card);
    });
  }

  async function renderIndustryDetails() {
    const container = document.getElementById("industry-details");
    if (!container) return;

    const [fields, tools] = await Promise.all([
      loadJSON("/data/industry_fields.json"),
      loadJSON("/data/tools.json")
    ]);

    const toolMap = Object.fromEntries(tools.map(t => [t.id, t.label]));
    container.innerHTML = "";

    fields.forEach(field => {
      const section = document.createElement("section");
      section.className = "content-section";
      section.id = field.id;

      section.innerHTML = `
        <div class="section-header">
          <h2>${field.label}</h2>
        </div>
        <p>${field.description}</p>
      `;

      const badgeContainer = document.createElement("div");
      badgeContainer.style.marginTop = "15px";

      field.tools.forEach(toolId => {
        if (!toolMap[toolId]) return;
        const badge = document.createElement("span");
        badge.textContent = toolMap[toolId];
        badge.style.cssText = `
          display:inline-block;
          margin:4px 8px 4px 0;
          padding:6px 10px;
          border:1px solid var(--border);
          border-radius:20px;
          font-size:0.75rem;
          font-weight:600;
        `;
        badgeContainer.appendChild(badge);
      });

      section.appendChild(badgeContainer);
      container.appendChild(section);
    });
  }

  /* =========================
     BACK TO TOP
     ========================= */

  function initBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const toggle = () => {
      if (window.scrollY > 400) btn.classList.add("is-visible");
      else btn.classList.remove("is-visible");
    };

    toggle();

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          toggle();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  }

  /* =========================
     INIT
     ========================= */

  document.addEventListener("DOMContentLoaded", () => {
    renderResearchStats();
    renderTopicsGrid();
    renderFullPublications();

    renderIndustryGrid();
    renderIndustryDetails();

    initBackToTop();

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

})();
