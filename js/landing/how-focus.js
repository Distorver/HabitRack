const howSection = document.querySelector(".how-section");

if (howSection) {
  const slides = Array.from(howSection.querySelectorAll(".how-slide"));
  const navItems = Array.from(howSection.querySelectorAll(".how-nav-item"));
  const indicator = howSection.querySelector(".how-indicator");
  const navRail = howSection.querySelector(".how-left");
  let activeSlide = null;
  let scrollFrame = null;

  const moveIndicator = (item) => {
    const itemRect = item.getBoundingClientRect();
    const railRect = navRail.getBoundingClientRect();
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const x = isMobile
      ? itemRect.left - railRect.left + itemRect.width / 2 - 5
      : itemRect.left - railRect.left - 18;
    const y = isMobile
      ? itemRect.bottom - railRect.top + 6
      : itemRect.top - railRect.top + itemRect.height / 2 - 6;

    indicator.style.setProperty("--how-indicator-x", `${x}px`);
    indicator.style.setProperty("--how-indicator-y", `${y}px`);
  };

  const setActiveSlide = (slide) => {
    if (!slide) {
      return;
    }

    if (activeSlide === slide) {
      return;
    }

    activeSlide = slide;
    slides.forEach((item) => {
      item.classList.toggle("is-active", item === activeSlide);
    });

    const activeIndex = slides.indexOf(activeSlide);
    navItems.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
      const link = item.querySelector("a");
      if (index === activeIndex) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    moveIndicator(navItems[activeIndex]);
  };

  const updateActiveSlide = () => {
    scrollFrame = null;
    const sectionRect = howSection.getBoundingClientRect();
    if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
      return;
    }

    const viewportCenter = window.innerHeight / 2;
    const closestSlide = slides.reduce(
      (closest, slide) => {
        const rect = slide.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        return distance < closest.distance ? { slide, distance } : closest;
      },
      { slide: null, distance: Number.POSITIVE_INFINITY },
    );

    setActiveSlide(closestSlide.slide);
  };

  const requestUpdate = () => {
    if (scrollFrame === null) {
      scrollFrame = window.requestAnimationFrame(updateActiveSlide);
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    requestUpdate();
    if (activeSlide) {
      moveIndicator(navItems[slides.indexOf(activeSlide)]);
    }
  });
  window.addEventListener("load", requestUpdate, { once: true });
  setActiveSlide(slides[0]);
}
