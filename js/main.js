// main.js
document.addEventListener("DOMContentLoaded", () => {
  // year placeholders
  const years = document.querySelectorAll("#year, #year2, #year3, #year4");
  years.forEach((el) => {
    if (el) el.textContent = new Date().getFullYear();
  });

  // hamburger
  document.querySelectorAll(".hamburger").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const nav = document.getElementById("nav-list");
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      const isOpen = nav.classList.toggle("open");
      // lock background scroll when nav is open
      if (isOpen) document.body.classList.add("no-scroll");
      else document.body.classList.remove("no-scroll");
    });
  });

  // close mobile nav when a nav link is clicked (improves mobile UX)
  (function attachNavLinkHandlers() {
    const nav = document.getElementById("nav-list");
    if (!nav) return;
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        if (nav.classList.contains("open")) {
          nav.classList.remove("open");
          document
            .querySelectorAll(".hamburger")
            .forEach((b) => b.setAttribute("aria-expanded", "false"));
          document.body.classList.remove("no-scroll");
        }
      });
    });
  })();

  // smooth scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // reveal on scroll using IntersectionObserver
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("reveal");
      });
    },
    { threshold: 0.12 }
  );
  document
    .querySelectorAll(".reveal-on-scroll")
    .forEach((el) => obs.observe(el));

  // contact form validation & UI (client-side)
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const out = document.getElementById("formMessage");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!name || !email || !message) {
        out.textContent = "Please fill out all fields.";
        out.style.color = "crimson";
        return;
      }
      if (!emailRegex.test(email)) {
        out.textContent = "Please use a valid email address.";
        out.style.color = "crimson";
        return;
      }
      // This is static — instruct user to configure a form endpoint (README)
      out.textContent =
        "Message ready to send. Configure Netlify/Formspree endpoint in README to enable submission.";
      out.style.color = "green";
      form.reset();
    });
  }
});
