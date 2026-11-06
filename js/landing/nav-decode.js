const navDecodeGlyphs = "!<>-_\\/[]{}=+*^?#";

document.querySelectorAll(".nav-link").forEach((link) => {
  const finalText = link.textContent.trim();
  const characters = Array.from(finalText);
  let intervalId = null;
  let frameCount = 0;

  link.setAttribute("aria-label", finalText);

  const decode = () => {
    if (
      intervalId !== null ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    frameCount = 0;
    intervalId = window.setInterval(() => {
      frameCount += 1;
      let isComplete = true;

      link.textContent = characters
        .map((character, index) => {
          if (/\s/.test(character) || frameCount > index) {
            return character;
          }

          isComplete = false;
          return navDecodeGlyphs[
            Math.floor(Math.random() * navDecodeGlyphs.length)
          ];
        })
        .join("");

      if (isComplete) {
        window.clearInterval(intervalId);
        intervalId = null;
        link.textContent = finalText;
      }
    }, 35);
  };

  link.addEventListener("pointerenter", decode);
  link.addEventListener("focus", decode);
});
