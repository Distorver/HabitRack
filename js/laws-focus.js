const lawsSection = document.querySelector(".laws-section");

if (lawsSection) {
  const laws = Array.from(lawsSection.querySelectorAll(".law"));
  const indicator = lawsSection.querySelector(".law-indicator");
  const image = lawsSection.querySelector(".law-img");
  let focusedLaw = null;
  let scrollFrame = null;

  const moveIndicator = (law) => {
    const markerLeft = parseFloat(
      window.getComputedStyle(law).getPropertyValue("--law-marker-left"),
    );
    const markerTop = parseFloat(
      window.getComputedStyle(law).getPropertyValue("--law-marker-top"),
    );

    indicator.style.left = `${law.offsetLeft + markerLeft}px`;
    indicator.style.top = `${law.offsetTop + markerTop}px`;
  };

  const focusLaw = (law, animate = true) => {
    if (focusedLaw === law) {
      moveIndicator(law);
      return;
    }

    focusedLaw?.classList.remove("is-focused");
    focusedLaw = law;
    focusedLaw.classList.add("is-focused");
    moveIndicator(focusedLaw);

    image.classList.remove("is-changing");
    image.src = focusedLaw.dataset.lawImage;
    image.alt = focusedLaw.dataset.lawImageAlt;

    if (animate) {
      indicator.classList.remove("is-bouncing");
      void indicator.offsetWidth;
      indicator.classList.add("is-bouncing");
      void image.offsetWidth;
      image.classList.add("is-changing");
    }
  };

  const updateFocusedLaw = () => {
    scrollFrame = null;
    const scrollProgress = Math.max(
      0,
      Math.min(
        laws.length - 1,
        Math.floor(-lawsSection.getBoundingClientRect().top / window.innerHeight),
      ),
    );

    focusLaw(laws[scrollProgress]);
  };

  const updateScrollMode = () => {
    lawsSection.classList.add("is-scroll-staged");
    lawsSection.style.height = `${window.innerHeight * (laws.length + 1)}px`;
    updateFocusedLaw();
  };

  focusLaw(laws[0], false);
  updateScrollMode();
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame === null) {
        scrollFrame = window.requestAnimationFrame(updateFocusedLaw);
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", updateScrollMode);
}
