// modal.js - minimal accessible modal for project details
(function () {
  function buildModal(project) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.tabIndex = -1;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", project.title);

    const closeBtn = document.createElement("button");
    closeBtn.className = "close";
    closeBtn.innerHTML = "✕";
    closeBtn.addEventListener("click", closeModal);

    modal.appendChild(closeBtn);

    // Title + metadata
    const h = document.createElement("h2");
    h.textContent = project.title;
    modal.appendChild(h);
    const pmeta = document.createElement("p");
    pmeta.className = "meta";
    pmeta.textContent = project.year + " — " + project.role;
    modal.appendChild(pmeta);

    // Carousel simple
    const carousel = document.createElement("div");
    carousel.className = "modal-carousel";
    const imgWrap = document.createElement("div");
    imgWrap.className = "modal-image-wrap";
    const img = document.createElement("img");
    img.src =
      project.images && project.images[0]
        ? project.images[0]
        : "assets/images/project-placeholder.jpg";
    img.alt = project.title + " — image";
    img.loading = "lazy";
    imgWrap.appendChild(img);
    carousel.appendChild(imgWrap);

    // controls
    if (project.images && project.images.length > 1) {
      let idx = 0;
      const left = document.createElement("button");
      left.textContent = "◀";
      left.className = "carousel-left";
      const right = document.createElement("button");
      right.textContent = "▶";
      right.className = "carousel-right";
      left.addEventListener("click", () => {
        idx = (idx - 1 + project.images.length) % project.images.length;
        img.src = project.images[idx];
      });
      right.addEventListener("click", () => {
        idx = (idx + 1) % project.images.length;
        img.src = project.images[idx];
      });
      modal.appendChild(left);
      modal.appendChild(right);

      // keyboard nav
      function onKey(e) {
        if (e.key === "ArrowLeft") left.click();
        if (e.key === "ArrowRight") right.click();
        if (e.key === "Escape") closeModal();
      }
      overlay._keyHandler = onKey;
      document.addEventListener("keydown", onKey);
    } else {
      // single image: allow ESC to close
      const escKey = (e) => {
        if (e.key === "Escape") closeModal();
      };
      overlay._keyHandler = escKey;
      document.addEventListener("keydown", escKey);
    }

    const desc = document.createElement("p");
    desc.textContent = project.full || project.short;
    modal.appendChild(carousel);
    modal.appendChild(desc);

    // tags
    const tags = document.createElement("div");
    tags.className = "tags";
    (project.tags || []).forEach((t) => {
      const s = document.createElement("span");
      s.textContent = t;
      tags.appendChild(s);
    });
    modal.appendChild(tags);

    overlay.appendChild(modal);
    overlay._cleanup = () => {
      if (overlay._keyHandler)
        document.removeEventListener("keydown", overlay._keyHandler);
    };
    return overlay;
  }

  function closeModal() {
    const root = document.getElementById("modal-root");
    const overlay = root.querySelector(".modal-overlay");
    if (overlay && typeof overlay._cleanup === "function") overlay._cleanup();
    root.innerHTML = "";
    root.setAttribute("aria-hidden", "true");
    // restore background scroll
    document.body.classList.remove("no-scroll");
  }

  function openModalFor(projectId) {
    const root = document.getElementById("modal-root");
    const projects = window.PROJECTS || [];
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    root.innerHTML = "";
    root.setAttribute("aria-hidden", "false");
    const modalEl = buildModal(project);
    root.appendChild(modalEl);
    // lock background scroll while modal open
    document.body.classList.add("no-scroll");
    // focus trap: focus first focusable
    const focusable = modalEl.querySelector(
      'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  }

  // attach click handlers to .view-project buttons
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".view-project");
    if (t) {
      const id = t.dataset.project;
      openModalFor(id);
    }
  });

  // close on Escape from anywhere
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  window.openProjectModal = openModalFor;
  window.closeProjectModal = closeModal;
})();
