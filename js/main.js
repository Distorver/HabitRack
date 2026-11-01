const nav = document.querySelector(".nav-section");

const onScroll = () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 40);
};

window.addEventListener("scroll", onScroll, { passive: true });
onScroll(); // run once on load in case the page starts scrolled
