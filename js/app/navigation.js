(() => {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  const overlay = document.getElementById("navOverlay");

  if (!toggle || !nav) return;

  function setOpen(isOpen) {
    nav.classList.toggle("active", isOpen);
    overlay?.classList.toggle("active", isOpen);
    overlay?.setAttribute("aria-hidden", String(!isOpen));
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );

    const icon = toggle.querySelector("ion-icon");
    if (icon) {
      icon.name = isOpen ? "close-outline" : "menu-outline";
    }
  }

  toggle.addEventListener("click", () => {
    setOpen(!nav.classList.contains("active"));
  });
  overlay?.addEventListener("click", () => setOpen(false));
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  if (window.matchMedia) {
    window
      .matchMedia("(min-width: 1025px)")
      .addEventListener?.("change", (event) => {
        if (event.matches) setOpen(false);
      });
  }
})();
