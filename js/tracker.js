(() => {
  /* ---------- settings ---------- */
  const CX = 430,
    CY = 400; // center of the circle
  const R_OUT = 350; // outer radius of the first habit row
  const ROW_H = 26.5; // thickness of each row
  const ROWS = 10;
  const DAYS = 28;
  const STEP = 8; // degrees per day
  const LABEL_W = 28; // thickness of the day-number ring
  const SCALE = 1.3; // scale of the hovered block (neighbors get a fraction)
  const RANGE = 130; // px: how far the ripple reaches
  const PUSH = 0; // px: how far neighbors get pushed away
  const DIM = 0.75; // opacity of blocks outside the ripple
  const TABLE_W = 400; // total width of the "№ + habit" table
  const NUM_W = 80;

  const colors = [
    "#f4b8c3",
    "#f7c8a4",
    "#f9e1a6",
    "#f4efc6",
    "#dfe8c6",
    "#bfe0cf",
    "#b6def0",
    "#c5d0ea",
    "#d6bee1",
    "#f4b8c3",
  ];
  const habits = ["Practise drawing!", "No smoking!", "No TV!"];

  /* state: 0 = empty, 1 = ✓, 2 = ✗ (click a block to cycle) */
  const state = Array.from({ length: ROWS }, () => Array(DAYS).fill(0));
  const demo = ["1111211111", "1111121211", "1111111221"];
  demo.forEach((str, r) => [...str].forEach((c, d) => (state[r][d] = +c)));

  /* ---------- helpers ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("tracker");
  const rad = (a) => (a * Math.PI) / 180;
  const pt = (r, a) => [CX + r * Math.sin(rad(a)), CY - r * Math.cos(rad(a))];

  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  const sector = (rO, rI, a0, a1) => {
    const [x1, y1] = pt(rO, a0),
      [x2, y2] = pt(rO, a1);
    const [x3, y3] = pt(rI, a1),
      [x4, y4] = pt(rI, a0);
    return `M${x1} ${y1}A${rO} ${rO} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${rI} ${rI} 0 0 0 ${x4} ${y4}Z`;
  };
  const box = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;

  const markPath = (s, x, y) =>
    s === 1
      ? `M${x - 6} ${y + 0}L${x - 2} ${y + 6}L${x + 7} ${y - 8}`
      : s === 2
        ? `M${x - 6} ${y - 6}L${x + 6} ${y + 6}M${x + 6} ${y - 6}L${x - 6} ${y + 6}`
        : "";

  /* ---------- layers ---------- */
  const cellsLayer = el("g", { class: "cells" }, svg);
  const ghost = el("g", { class: "ghost" }, svg);
  const hitLayer = el("g", {}, svg);

  const cells = [];

  function addCell({ d, fill, cls = "", cx, cy, interactive = true, build }) {
    const g = el("g", { class: "cell " + cls }, cellsLayer);
    g.style.transformOrigin = `${cx}px ${cy}px`;
    el("path", { d, fill, class: "shape" }, g);
    const extra = build ? build(g) : {};
    const hit = el(
      "path",
      { d, class: "hit" + (interactive ? "" : " static") },
      hitLayer,
    );
    const cell = { g, cx, cy, ...extra };
    cells.push(cell);
    hit.addEventListener("pointerenter", () => show(cell));
    hit.addEventListener("pointerleave", hide);
    return { cell, hit };
  }

  /* ---------- table (left) ---------- */
  const tx = CX - TABLE_W;
  const topY = CY - R_OUT;
  const hdrY = topY - LABEL_W;

  addCell({
    d: box(tx, hdrY, NUM_W, LABEL_W),
    fill: "#fff",
    cls: "hdr",
    cx: tx + NUM_W / 2,
    cy: hdrY + LABEL_W / 2,
    build: (g) => {
      const t = el(
        "text",
        { x: tx + NUM_W / 2, y: hdrY + LABEL_W / 2, class: "hdr-text" },
        g,
      );
      t.textContent = "№";
    },
  });
  addCell({
    d: box(tx + NUM_W, hdrY, TABLE_W - NUM_W, LABEL_W),
    fill: "#fff",
    cls: "hdr",
    cx: tx + NUM_W + (TABLE_W - NUM_W) / 2,
    cy: hdrY + LABEL_W / 2,
    build: (g) => {
      const t = el(
        "text",
        {
          x: tx + NUM_W + (TABLE_W - NUM_W) / 2,
          y: hdrY + LABEL_W / 2,
          class: "hdr-text",
        },
        g,
      );
      t.textContent = "daily habits";
    },
  });

  for (let r = 0; r < ROWS; r++) {
    const y = topY + r * ROW_H;
    const mid = y + ROW_H / 2;

    addCell({
      d: box(tx, y, NUM_W, ROW_H),
      fill: colors[r],
      cx: tx + NUM_W / 2,
      cy: mid,
      build: (g) => {
        if (habits[r]) {
          const t = el("text", { x: tx + NUM_W / 2, y: mid, class: "num" }, g);
          t.textContent = r + 1;
        }
      },
    });
    addCell({
      d: box(tx + NUM_W, y, TABLE_W - NUM_W, ROW_H),
      fill: colors[r],
      cx: tx + NUM_W + (TABLE_W - NUM_W) / 2,
      cy: mid,
      build: (g) => {
        if (habits[r]) {
          const t = el(
            "text",
            { x: tx + NUM_W + 12, y: mid, class: "hand" },
            g,
          );
          t.textContent = habits[r];
        }
      },
    });
  }

  /* ---------- day-number ring ---------- */
  for (let d = 0; d < DAYS; d++) {
    const a0 = d * STEP,
      a1 = a0 + STEP,
      am = a0 + STEP / 2;
    const [x, y] = pt(R_OUT + LABEL_W / 2, am);
    const flip = am > 90 && am < 270 ? 180 : 0;

    addCell({
      d: sector(R_OUT + LABEL_W, R_OUT, a0, a1),
      fill: "#fff",
      cls: "day-label",
      cx: x,
      cy: y,
      build: (g) => {
        const t = el(
          "text",
          { x, y, transform: `rotate(${am + flip} ${x} ${y})` },
          g,
        );
        t.textContent = d + 1;
      },
    });
  }

  /* ---------- the radial grid ---------- */
  for (let r = 0; r < ROWS; r++) {
    const rO = R_OUT - r * ROW_H,
      rI = rO - ROW_H;
    for (let d = 0; d < DAYS; d++) {
      const a0 = d * STEP,
        a1 = a0 + STEP;
      const [x, y] = pt((rO + rI) / 2, a0 + STEP / 2);

      const { cell, hit } = addCell({
        d: sector(rO, rI, a0, a1),
        fill: colors[r],
        cx: x,
        cy: y,
        build: (g) => ({
          mark: el(
            "path",
            { class: "mark", d: markPath(state[r][d], x, y) },
            g,
          ),
        }),
      });

      hit.addEventListener("click", () => {
        state[r][d] = (state[r][d] + 1) % 3;
        cell.mark.setAttribute("d", markPath(state[r][d], x, y));
        show(cell); // refresh the hovered copy
      });
    }
  }

  /* ---------- hover: scaled copy of the block ---------- */
  const IDLE = "translate(0px, 0px) scale(1)";

  /* every other block reacts according to its distance from the hovered one */
  function ripple(src) {
    for (const c of cells) {
      if (c === src) {
        c.g.style.transform = IDLE;
        c.g.style.opacity = 1;
        continue;
      }
      const dx = c.cx - src.cx,
        dy = c.cy - src.cy;
      const dist = Math.hypot(dx, dy);
      const k = Math.pow(Math.max(0, 1 - dist / RANGE), 2); // 1 = touching, 0 = out of range
      const s = 1 + (SCALE - 1) * k;
      const px = dist ? (dx / dist) * PUSH * k : 0;
      const py = dist ? (dy / dist) * PUSH * k : 0;
      c.g.style.transform = `translate(${px}px, ${py}px) scale(${s})`;
      c.g.style.opacity = DIM + (1 - DIM) * k;
    }
  }
  function settle() {
    for (const c of cells) {
      c.g.style.transform = IDLE;
      c.g.style.opacity = 1;
    }
  }

  let anim = null;
  let hideFrame = 0;
  function show(cell) {
    cancelAnimationFrame(hideFrame); // moving cell to cell: keep the ripple going
    ripple(cell);
    ghost.replaceChildren(
      ...[...cell.g.children].map((n) => n.cloneNode(true)),
    );
    ghost.style.transformOrigin = `${cell.cx}px ${cell.cy}px`;
    anim && anim.cancel();
    anim = ghost.animate(
      [{ transform: "scale(1)" }, { transform: `scale(${SCALE})` }],
      {
        duration: 140,
        easing: "cubic-bezier(.2,.8,.3,1)",
        fill: "forwards",
      },
    );
  }
  function hide() {
    anim && anim.cancel();
    ghost.replaceChildren();
    // wait one frame so the figure doesn't snap back when the mouse
    // slides from one block straight into the next
    hideFrame = requestAnimationFrame(settle);
  }
})();
