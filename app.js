(function () {
  const content = window.PORTFOLIO_CONTENT;
  const profile = content.profile;

  document.querySelectorAll("[data-profile=name]").forEach((el) => el.textContent = profile.name);
  document.querySelectorAll("[data-profile=email]").forEach((el) => {
    el.textContent = profile.email;
    el.href = `mailto:${profile.email}`;
  });
  document.querySelectorAll("[data-profile=linkedin]").forEach((el) => el.href = profile.linkedin);
  document.querySelectorAll("[data-year]").forEach((el) => el.textContent = new Date().getFullYear());

  const menuButton = document.querySelector(".menu-button");
  const navLinks = document.querySelector(".nav-links");
  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      navLinks.classList.toggle("is-open", !open);
    });
  }

  const horizontalTrack = document.querySelector("[data-horizontal-track]");
  if (horizontalTrack) {
    const progress = document.querySelector("[data-scroll-progress]");
    let wheelTotal = 0;
    let wheelLocked = false;
    let wheelResetTimer;
    let scrollAnimation;
    const updateProgress = () => {
      const max = horizontalTrack.scrollWidth - horizontalTrack.clientWidth;
      const ratio = max > 0 ? horizontalTrack.scrollLeft / max : 0;
      if (progress) progress.style.transform = `scaleX(${ratio})`;
    };
    const goToPanel = (index) => {
      const panels = horizontalTrack.children.length;
      const next = Math.max(0, Math.min(panels - 1, index));
      const target = next * horizontalTrack.clientWidth;
      const start = horizontalTrack.scrollLeft;
      const duration = 850;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        horizontalTrack.scrollLeft = target;
        return;
      }

      cancelAnimationFrame(scrollAnimation);
      horizontalTrack.style.scrollSnapType = "none";
      horizontalTrack.style.scrollBehavior = "auto";
      const startedAt = performance.now();
      const easeInOutCubic = (value) => value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;

      const animate = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        horizontalTrack.scrollLeft = start + (target - start) * easeInOutCubic(progress);
        if (progress < 1) {
          scrollAnimation = requestAnimationFrame(animate);
          return;
        }
        horizontalTrack.scrollLeft = target;
        horizontalTrack.style.scrollSnapType = "";
        horizontalTrack.style.scrollBehavior = "";
        wheelLocked = false;
      };

      scrollAnimation = requestAnimationFrame(animate);
    };
    horizontalTrack.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("wheel", (event) => {
      if (!window.matchMedia("(min-width: 761px)").matches) return;
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (wheelLocked) return;
      const movement = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      wheelTotal += movement;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => { wheelTotal = 0; }, 180);
      if (Math.abs(wheelTotal) < 90) return;
      const current = Math.round(horizontalTrack.scrollLeft / horizontalTrack.clientWidth);
      const direction = wheelTotal > 0 ? 1 : -1;
      wheelTotal = 0;
      wheelLocked = true;
      goToPanel(current + direction);
    }, { passive: false, capture: true });
    window.addEventListener("keydown", (event) => {
      if (!window.matchMedia("(min-width: 761px)").matches) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const current = Math.round(horizontalTrack.scrollLeft / horizontalTrack.clientWidth);
        goToPanel(current + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  function projectCard(project) {
    return `
      <article class="project-card">
        <a class="project-card__link" href="project.html?case=${encodeURIComponent(project.slug)}" aria-label="View ${project.title}">
          <div class="project-card__visual ${project.image ? "has-image" : ""}" ${project.image ? `style="background-image:url('${project.image}')"` : ""}>
            <span>${project.number}</span>
            <b>${project.discipline}</b>
          </div>
          <div class="project-card__copy">
            <p class="eyebrow">${project.discipline} · ${project.year}</p>
            <h3>${project.title}</h3>
            <p>${project.teaser}</p>
            <span class="text-link">View case <i aria-hidden="true">↗</i></span>
          </div>
        </a>
      </article>`;
  }

  document.querySelectorAll("[data-project-list]").forEach((list) => {
    const limit = Number(list.dataset.limit || content.projects.length);
    list.innerHTML = content.projects.slice(0, limit).map(projectCard).join("");
  });

  const caseRoot = document.querySelector("[data-project-detail]");
  if (caseRoot) {
    const slug = new URLSearchParams(window.location.search).get("case");
    const project = content.projects.find((item) => item.slug === slug) || content.projects[0];
    document.title = `${project.title} — ${profile.name}`;
    caseRoot.innerHTML = `
      <header class="case-hero">
        <p class="eyebrow">${project.number} / ${project.discipline} / ${project.year}</p>
        <h1>${project.title}</h1>
        <p class="case-hero__lead">${project.teaser}</p>
      </header>
      <div class="case-visual ${project.image ? "has-image" : ""}" ${project.image ? `style="background-image:url('${project.image}')"` : ""}>
        <span>${project.number}</span>
        <p>Add a project image in <code>content.js</code></p>
      </div>
      <div class="case-grid">
        <section><p class="eyebrow">The challenge</p><p>${project.challenge}</p></section>
        <section><p class="eyebrow">The insight</p><p>${project.insight}</p></section>
        <section class="case-grid__wide"><p class="eyebrow">The direction</p><h2>${project.idea}</h2></section>
        <section><p class="eyebrow">My contribution</p><p>${project.contribution}</p></section>
        <section><p class="eyebrow">Outcome</p><p>${project.outcome}</p></section>
      </div>`;
  }

  const portrait = document.querySelector("[data-portrait]");
  if (portrait && profile.portrait) {
    const image = new Image();
    image.alt = `Portrait of ${profile.name}`;
    image.addEventListener("load", () => {
      portrait.appendChild(image);
      portrait.classList.add("has-image");
    });
    image.src = profile.portrait;
  }
})();
