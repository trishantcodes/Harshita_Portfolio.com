// gallery.js — improved project renderer + smooth image slider/modal
(function () {
  // ---------- Configurable defaults ----------
  const DEFAULTS = {
    rootSelector: "#projects-root",
    altThumb: "assets/images/project-placeholder.jpg",
    revealThreshold: 0.12,
    carousel: {
      // autoplay false by default to preserve user control
      autoplay: false,
      autoplayInterval: 5000,
      transitionMs: 380,
      touchSwipeThreshold: 20, // px
    },
  };

  // ---------- Default projects dataset (edit/replace by modifying this file) ----------
  if (!window.PROJECTS) {
    window.PROJECTS = [
      {
        id: "p1",
        title: "Kid's Library — Thesis",
        short: "Design research and spatial planning for a child-friendly library.",
        full:
          "Comprehensive design research and spatial planning for a child-friendly library including zoning, materials research, passive strategies, and learning-focused programming.",
        images: [
          "assets/images/project1_1.jpg",
          "assets/images/project1_2.jpg",
          "assets/images/project1_3.jpg",
        ],
        thumb: "assets/images/project1_thumb.jpg",
        tags: ["Research", "Interior Design", "Masterplan"],
        role: "Design Lead",
        timeline: "2023 - 2024",
        tools: ["AutoCAD", "SketchUp", "Photoshop"],
        takeaway: [
          "Child-centric spatial zoning",
          "Sustainable materials selection",
          "Interactive learning spaces",
        ],
      },
      {
        id: "p2",
        title: "Interior Design Study",
        short: "Residential & institutional interiors with CAD documentation.",
        full: "Residential and institutional interior case studies and furniture detailing with thorough documentation.",
        images: ["assets/images/project2_1.jpg", "assets/images/project2_2.jpg"],
        thumb: "assets/images/project2_thumb.jpg",
        tags: ["AutoCAD", "SketchUp", "Detailing"],
        role: "Intern Designer",
        timeline: "2022 - 2023",
        tools: ["AutoCAD", "SketchUp"],
        takeaway: ["Technical detailing", "Client collaboration", "Material boards"],
      },
      {
        id: "p3",
        title: "Sustainable Community Space",
        short: "Concept for eco-friendly community gathering space.",
        full:
          "Concept design emphasizing recycled materials, passive design, and social engagement strategies for a community hub.",
        images: ["assets/images/project3_1.jpg", "assets/images/project3_2.jpg"],
        thumb: "assets/images/project3_thumb.jpg",
        tags: ["Sustainability", "Community Design", "Research"],
        role: "Concept Designer",
        timeline: "2022",
        tools: ["SketchUp", "Adobe Suite"],
        takeaway: ["Passive strategies", "Community engagement", "Low-cost materials"],
      },
    ];
  }

  // ---------- Helper utilities ----------
  function el(tag, cls, attrs = {}) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    Object.keys(attrs).forEach((k) => d.setAttribute(k, attrs[k]));
    return d;
  }

  function safeQuery(selector) {
    return document.querySelector(selector) || null;
  }

  function createProjectCard(project, options) {
    const card = el("article", "project-card reveal-on-scroll");
    card.setAttribute("data-project-id", project.id);

    const thumbSrc = project.thumb || (project.images && project.images[0]) || options.altThumb;
    const img = el("img");
    img.src = thumbSrc;
    img.alt = `${project.title} — thumbnail`;
    img.loading = "lazy";

    const info = el("div", "project-info");
    const h3 = el("h3");
    h3.textContent = project.title;
    const p = el("p", "project-excerpt");
    p.textContent = project.short || "";
    const tagWrap = el("div", "tags");
    (project.tags || []).forEach((t) => {
      const s = el("span");
      s.textContent = t;
      tagWrap.appendChild(s);
    });

    const btn = el("button", "btn small view-project");
    btn.type = "button";
    btn.setAttribute("data-project", project.id);
    btn.setAttribute("aria-haspopup", "dialog");
    btn.textContent = "View Details";

    info.appendChild(h3);
    info.appendChild(p);
    info.appendChild(tagWrap);
    info.appendChild(btn);

    card.appendChild(img);
    card.appendChild(info);

    return card;
  }

  // ---------- Reveal on scroll (IntersectionObserver) ----------
  function enableRevealOnScroll(selector, threshold = 0.12) {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("reveal");
        });
      },
      { threshold }
    );
    nodes.forEach((n) => obs.observe(n));
  }

  // ---------- Modal + Carousel Implementation ----------
  // This module will define window.openProjectModal only if not already present.
  function createModalSkeleton() {
    // if modal exists already, reuse
    if (safeQuery("#project-modal-root")) return;

    const modalRoot = el("div", "project-modal", { id: "project-modal-root", "aria-hidden": "true" });
    modalRoot.innerHTML = `
      <div class="project-modal__backdrop" data-close="true"></div>
      <div class="project-modal__dialog" role="dialog" aria-modal="true" aria-label="Project details">
        <button class="project-modal__close" aria-label="Close (Esc)">✕</button>
        <div class="project-modal__content">
          <div class="project-modal__carousel" tabindex="0" aria-roledescription="carousel"></div>
          <div class="project-modal__meta">
            <h2 class="project-modal__title"></h2>
            <p class="project-modal__full"></p>
            <ul class="project-modal__meta-list"></ul>
            <div class="project-modal__takeaway"></div>
          </div>
        </div>
        <button class="project-modal__prev" aria-label="Previous image">◀</button>
        <button class="project-modal__next" aria-label="Next image">▶</button>
      </div>
    `;
    document.body.appendChild(modalRoot);

    // minimal styles inserted so slider transitions feel smooth even if CSS file not yet present
    const tmpStyle = document.createElement("style");
    tmpStyle.textContent = `
      /* Minimal inline modal/carousel styles — override in your CSS */
      .project-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:9999}
      .project-modal[aria-hidden="false"]{display:flex}
      .project-modal__backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.55)}
      .project-modal__dialog{position:relative;max-width:1100px;width:94%;max-height:92vh;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.35);display:flex;flex-direction:column}
      .project-modal__content{display:flex;gap:18px;padding:18px;align-items:flex-start;overflow:auto}
      .project-modal__carousel{flex:1;min-width:320px;max-width:720px;position:relative;outline:none}
      .project-modal__carousel .slides{display:flex;transition:transform ${DEFAULTS.carousel.transitionMs}ms ease;will-change:transform}
      .project-modal__carousel .slide{min-width:100%;box-sizing:border-box;padding:6px;display:flex;align-items:center;justify-content:center}
      .project-modal__carousel img{max-width:100%;max-height:66vh;object-fit:contain;border-radius:6px;display:block}
      .project-modal__meta{flex:0 0 360px;overflow:auto}
      .project-modal__close{position:absolute;top:8px;right:8px;border:0;background:transparent;font-size:20px;cursor:pointer}
      .project-modal__prev,.project-modal__next{position:absolute;top:50%;transform:translateY(-50%);background:transparent;border:0;font-size:22px;cursor:pointer;padding:12px}
      .project-modal__prev{left:6px} .project-modal__next{right:6px}
      .project-modal__meta-list{list-style:none;padding:0;margin:8px 0}
      .project-modal__takeaway{margin-top:12px}
    `;
    document.head.appendChild(tmpStyle);
  }

  function mountCarouselImages(container, images, options) {
    // container is .project-modal__carousel
    container.innerHTML = ""; // clear
    const slides = el("div", "slides");
    slides.style.width = `${images.length * 100}%`;

    images.forEach((src, i) => {
      const slide = el("div", "slide");
      const img = el("img");
      img.dataset.index = String(i);
      img.loading = "lazy";
      img.alt = `Project image ${i + 1} of ${images.length}`;
      img.src = src;
      slide.appendChild(img);
      slides.appendChild(slide);
    });

    container.appendChild(slides);

    // add dots / position indicator
    const indicator = el("div", "carousel-indicator", { "aria-hidden": "true" });
    indicator.style.marginTop = "8px";
    indicator.innerHTML = images
      .map((_, i) => `<button class="dot" data-dot="${i}" aria-label="Go to image ${i + 1}">${i + 1}</button>`)
      .join(" ");
    container.appendChild(indicator);

    return { slidesEl: slides, indicatorEl: indicator, slideCount: images.length };
  }

  function initModalInteractions(modalRoot, options) {
    const dialog = modalRoot.querySelector(".project-modal__dialog");
    const backdrop = modalRoot.querySelector(".project-modal__backdrop");
    const closeBtn = modalRoot.querySelector(".project-modal__close");
    const prevBtn = modalRoot.querySelector(".project-modal__prev");
    const nextBtn = modalRoot.querySelector(".project-modal__next");
    const carousel = modalRoot.querySelector(".project-modal__carousel");

    let state = {
      curIndex: 0,
      slidesEl: null,
      slideCount: 0,
      autoplayTimer: null,
      isDragging: false,
      startX: 0,
      currentTranslate: 0,
      prevTranslate: 0,
    };

    function setPositionByIndex(index, animate = true) {
      if (!state.slidesEl) return;
      state.curIndex = (index + state.slideCount) % state.slideCount;
      const offset = -state.curIndex * 100;
      if (!animate) state.slidesEl.style.transition = "none";
      state.slidesEl.style.transform = `translateX(${offset}%)`;
      // re-enable transition after next tick
      if (!animate) {
        requestAnimationFrame(() => {
          state.slidesEl.style.transition = "";
        });
      }
      // update indicators
      const dots = modalRoot.querySelectorAll(".carousel-indicator .dot");
      dots.forEach((d) => d.classList.remove("active"));
      if (dots[state.curIndex]) dots[state.curIndex].classList.add("active");
    }

    function goNext() {
      setPositionByIndex(state.curIndex + 1);
      resetAutoplay();
    }
    function goPrev() {
      setPositionByIndex(state.curIndex - 1);
      resetAutoplay();
    }

    function onKey(e) {
      if (modalRoot.getAttribute("aria-hidden") === "true") return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    function openModal(project) {
      // populate meta contents
      modalRoot.querySelector(".project-modal__title").textContent = project.title || "";
      modalRoot.querySelector(".project-modal__full").textContent = project.full || "";
      const metaList = modalRoot.querySelector(".project-modal__meta-list");
      metaList.innerHTML = `
        <li><strong>Role:</strong> ${project.role || "-"}</li>
        <li><strong>Timeline:</strong> ${project.timeline || "-"}</li>
        <li><strong>Tools:</strong> ${(project.tools || []).join(", ") || "-"}</li>
      `;
      const takeaway = modalRoot.querySelector(".project-modal__takeaway");
      takeaway.innerHTML = `<strong>Key takeaways:</strong><ul>${(project.takeaway || [])
        .map((t) => `<li>${t}</li>`)
        .join("")}</ul>`;

      // mount images
      const images = project.images && project.images.length ? project.images : [project.thumb || options.altThumb];
      const { slidesEl, indicatorEl, slideCount } = mountCarouselImages(modalRoot.querySelector(".project-modal__carousel"), images, options);
      state.slidesEl = slidesEl;
      state.slideCount = slideCount;
      setPositionByIndex(0, false);

      // wire interactions (dots)
      indicatorEl.querySelectorAll(".dot").forEach((dot) => {
        dot.addEventListener("click", (ev) => {
          const idx = parseInt(dot.getAttribute("data-dot"), 10);
          setPositionByIndex(idx);
          resetAutoplay();
        });
      });

      // prev/next
      prevBtn.onclick = goPrev;
      nextBtn.onclick = goNext;

      // close
      closeBtn.onclick = closeModal;
      backdrop.onclick = (e) => {
        if (e.target.dataset.close === "true") closeModal();
      };

      // keyboard
      document.addEventListener("keydown", onKey);

      // touch/drag for carousel
      let startX = 0;
      let currentX = 0;
      let dragging = false;
      state.slidesEl.addEventListener("pointerdown", (e) => {
        dragging = true;
        startX = e.clientX;
        state.slidesEl.style.transition = "none";
        state.slidesEl.setPointerCapture(e.pointerId);
      });
      state.slidesEl.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        currentX = e.clientX;
        const dx = currentX - startX;
        const percent = (dx / state.slidesEl.clientWidth) * 100;
        const offset = -state.curIndex * 100 + percent;
        state.slidesEl.style.transform = `translateX(${offset}%)`;
      });
      state.slidesEl.addEventListener("pointerup", (e) => {
        if (!dragging) return;
        dragging = false;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > options.carousel.touchSwipeThreshold) {
          if (dx < 0) setPositionByIndex(state.curIndex + 1);
          else setPositionByIndex(state.curIndex - 1);
        } else {
          setPositionByIndex(state.curIndex);
        }
        state.slidesEl.style.transition = "";
      });
      state.slidesEl.addEventListener("pointercancel", () => {
        dragging = false;
        setPositionByIndex(state.curIndex);
        state.slidesEl.style.transition = "";
      });

      // autoplay
      function startAutoplay() {
        if (!options.carousel.autoplay) return;
        clearInterval(state.autoplayTimer);
        state.autoplayTimer = setInterval(() => {
          setPositionByIndex(state.curIndex + 1);
        }, options.carousel.autoplayInterval);
      }
      function resetAutoplay() {
        if (!options.carousel.autoplay) return;
        clearInterval(state.autoplayTimer);
        startAutoplay();
      }
      startAutoplay();

      // show modal
      modalRoot.setAttribute("aria-hidden", "false");
      // focus management: focus the carousel for keyboard nav
      carousel.focus();
    }

    function closeModal() {
      modalRoot.setAttribute("aria-hidden", "true");
      // teardown
      document.removeEventListener("keydown", onKey);
      prevBtn.onclick = null;
      nextBtn.onclick = null;
      closeBtn.onclick = null;
      backdrop.onclick = null;
      if (state.autoplayTimer) clearInterval(state.autoplayTimer);
      state.slidesEl = null;
      state.slideCount = 0;
      state.curIndex = 0;
    }

    return {
      openModal,
      closeModal,
    };
  }

  // ---------- Public render function ----------
  function renderProjects(rootSelector = DEFAULTS.rootSelector, opts = {}) {
    const options = Object.assign({}, DEFAULTS, opts);
    const root =
      document.querySelector(rootSelector) || document.querySelector(".projects-grid");
    if (!root) return;

    // clear and render
    root.innerHTML = "";
    window.PROJECTS.forEach((p) => {
      const card = createProjectCard(p, options);
      root.appendChild(card);
    });

    // reveal animation
    enableRevealOnScroll(".reveal-on-scroll", options.revealThreshold);

    // Ensure modal skeleton exists and init interactions (only used if built-in)
    createModalSkeleton();
    const modalRoot = safeQuery("#project-modal-root");
    const modalAPI = initModalInteractions(modalRoot, options);

    // attach handlers to view buttons
    document.querySelectorAll(".view-project").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-project");
        const project = window.PROJECTS.find((x) => x.id === id);
        if (!project) return;
        // prefer user-provided openProjectModal; otherwise use built-in
        if (typeof window.openProjectModal === "function") {
          try {
            window.openProjectModal(id);
          } catch (err) {
            // fallback to local modal if user implementation fails
            modalAPI.openModal(project);
          }
        } else {
          modalAPI.openModal(project);
        }
      });
    });
  }

  // expose API globally
  document.addEventListener("DOMContentLoaded", () => {
    renderProjects(DEFAULTS.rootSelector);
    // Also try other common container
    renderProjects(".projects-grid");
    window.renderProjects = renderProjects;
    // Only set window.openProjectModal if not already provided (non-destructive)
    if (typeof window.openProjectModal !== "function") {
      // provide a simple wrapper that accepts id or project object
      window.openProjectModal = (idOrProject) => {
        const modalRoot = safeQuery("#project-modal-root");
        if (!modalRoot) return;
        const api = initModalInteractions(modalRoot, DEFAULTS);
        let project = idOrProject;
        if (typeof idOrProject === "string") {
          project = window.PROJECTS.find((p) => p.id === idOrProject);
        }
        if (project) api.openModal(project);
      };
    }
  });
})();
