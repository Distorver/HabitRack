const lawsSection = document.querySelector(".laws-section");

if (lawsSection) {
  const laws = Array.from(lawsSection.querySelectorAll(".law"));
  const indicator = lawsSection.querySelector(".law-indicator");
  const image = lawsSection.querySelector(".law-img");
  const stepSize = () => window.innerHeight * 0.65;
  const preloadedImages = new WeakMap();
  let focusedLaw = null;
  let scrollFrame = null;

  const preloadImages = () => {
    laws.forEach((law) => {
      const preloadedImage = new Image();
      preloadedImage.decoding = "async";
      preloadedImage.src = law.dataset.lawImage;
      preloadedImages.set(law, preloadedImage);
    });
  };

  const moveIndicator = (law) => {
    const markerLeft = parseFloat(
      window.getComputedStyle(law).getPropertyValue("--law-marker-left"),
    );
    const markerTop = parseFloat(
      window.getComputedStyle(law).getPropertyValue("--law-marker-top"),
    );

    const markerX = law.offsetLeft + markerLeft;
    const markerY = law.offsetTop + markerTop;
    indicator.style.transform = `translate3d(${markerX}px, ${markerY}px, 0)`;
  };

  const focusLaw = (law, animate = true) => {
    if (focusedLaw === law) {
      return;
    }

    focusedLaw?.classList.remove("is-focused");
    focusedLaw = law;
    focusedLaw.classList.add("is-focused");
    moveIndicator(focusedLaw);
    laws.forEach((item) => {
      if (item === focusedLaw) {
        item.setAttribute("aria-current", "true");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    if (!animate) {
      image.src =
        preloadedImages.get(focusedLaw)?.src ?? focusedLaw.dataset.lawImage;
      image.alt = focusedLaw.dataset.lawImageAlt;
      return;
    }

    image.classList.add("is-changing");
    window.requestAnimationFrame(() => {
      if (focusedLaw !== law) {
        return;
      }

      image.src =
        preloadedImages.get(focusedLaw)?.src ?? focusedLaw.dataset.lawImage;
      image.alt = focusedLaw.dataset.lawImageAlt;
      image.classList.remove("is-changing");
    });
  };

  const updateFocusedLaw = () => {
    scrollFrame = null;
    const sectionRect = lawsSection.getBoundingClientRect();
    if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
      return;
    }

    const scrollProgress = Math.max(
      0,
      Math.min(
        laws.length - 1,
        Math.floor((-sectionRect.top + 1) / stepSize()),
      ),
    );

    focusLaw(laws[scrollProgress]);
  };

  laws.forEach((law, index) => {
    law.addEventListener("click", () => {
      const sectionTop =
        window.scrollY + lawsSection.getBoundingClientRect().top;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: sectionTop + index * stepSize(),
        behavior: reduceMotion ? "instant" : "smooth",
      });
    });
  });

  const updateScrollMode = () => {
    lawsSection.classList.add("is-scroll-staged");
    const scrollHeight =
      window.innerHeight + stepSize() * (laws.length - 1);
    lawsSection.style.height = `${scrollHeight}px`;
    updateFocusedLaw();
    moveIndicator(focusedLaw);
  };

  focusLaw(laws[0], false);
  updateScrollMode();
  if ("IntersectionObserver" in window) {
    const imagePreloadObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          preloadImages();
          observer.disconnect();
        }
      },
      { rootMargin: `${window.innerHeight}px 0px` },
    );
    imagePreloadObserver.observe(lawsSection);
  } else {
    preloadImages();
  }

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
