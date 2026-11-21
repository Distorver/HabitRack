(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const scrollRoot = document.scrollingElement;
  const scrollFactor = 0.72;
  const easingDuration = 120;
  const lineHeight =
    parseFloat(window.getComputedStyle(document.documentElement).lineHeight) ||
    16;
  let targetScrollY = window.scrollY;
  let animationFrame = null;
  let previousFrameTime = 0;
  let previousScrollBehavior = null;

  const maxScrollY = () =>
    Math.max(0, scrollRoot.scrollHeight - window.innerHeight);
  const clampScrollY = (position) =>
    Math.max(0, Math.min(position, maxScrollY()));

  const restoreScrollBehavior = () => {
    if (previousScrollBehavior !== null) {
      scrollRoot.style.scrollBehavior = previousScrollBehavior;
      previousScrollBehavior = null;
    }
  };

  const stopAnimation = () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    restoreScrollBehavior();
    previousFrameTime = 0;
    targetScrollY = window.scrollY;
  };

  const hasScrollableParent = (target, deltaY) => {
    let element = target instanceof Element ? target : target?.parentElement;

    while (element && element !== document.body) {
      const overflowY = window.getComputedStyle(element).overflowY;
      const maxElementScroll = element.scrollHeight - element.clientHeight;

      if (
        (overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowY === "overlay") &&
        maxElementScroll > 0
      ) {
        if (
          (deltaY < 0 && element.scrollTop > 0) ||
          (deltaY > 0 && element.scrollTop < maxElementScroll)
        ) {
          return true;
        }
      }

      element = element.parentElement;
    }

    return false;
  };

  const animateScroll = (time) => {
    animationFrame = null;
    const elapsed = previousFrameTime
      ? Math.min(time - previousFrameTime, 50)
      : 16;
    previousFrameTime = time;

    const currentScrollY = window.scrollY;
    const remaining = targetScrollY - currentScrollY;

    if (Math.abs(remaining) <= 4.5) {
      window.scrollTo({ top: targetScrollY, behavior: "auto" });
      targetScrollY = window.scrollY;
      restoreScrollBehavior();
      previousFrameTime = 0;
      return;
    }

    const progress = 1 - Math.exp(-elapsed / easingDuration);
    window.scrollTo({
      top: currentScrollY + remaining * progress,
      behavior: "auto",
    });
    animationFrame = window.requestAnimationFrame(animateScroll);
  };

  const handleWheel = (event) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.shiftKey ||
      event.deltaY === 0 ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (
      target?.closest("input, textarea, select, [contenteditable='true']") ||
      hasScrollableParent(target, event.deltaY)
    ) {
      return;
    }

    const deltaUnit =
      event.deltaMode === 1
        ? lineHeight
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
    const delta = event.deltaY * deltaUnit * scrollFactor;
    const currentScrollY = window.scrollY;

    const currentTarget =
      animationFrame === null ? currentScrollY : targetScrollY;
    const nextTarget = clampScrollY(currentTarget + delta);
    if (Math.abs(nextTarget - currentTarget) < 0.5) {
      return;
    }

    event.preventDefault();
    targetScrollY = nextTarget;

    if (animationFrame === null) {
      previousScrollBehavior = scrollRoot.style.scrollBehavior;
      scrollRoot.style.scrollBehavior = "auto";
      previousFrameTime = 0;
      animationFrame = window.requestAnimationFrame(animateScroll);
    }
  };

  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("pointerdown", stopAnimation, { passive: true });
  window.addEventListener("touchstart", stopAnimation, { passive: true });
  window.addEventListener(
    "keydown",
    (event) => {
      const scrollKeys = [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ];
      if (scrollKeys.includes(event.key)) {
        stopAnimation();
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    targetScrollY = clampScrollY(targetScrollY);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimation();
    }
  });
})();
