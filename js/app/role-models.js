const RoleModels = (() => {
  const ROLE_MODELS = [
    { id:"franklin-virtues", person:"Benjamin Franklin", category:"history", certainty:"documented", habit:"Tracking 13 virtues every day", summary:"He kept a small chart and marked every day he slipped.", how:"He listed 13 virtues, focused on one per week, and marked a dot for each fault at the end of the day.", results:"He wrote that the practice made him a better man than he would otherwise have been, even though he never reached perfection.", consistency:"He describes keeping the chart going for years, and admits he let it lapse when travel and business got busy.", source:"The Autobiography of Benjamin Franklin", draft:{name:"Daily review",goal:"Daily tracking",target:0,unit:"",icon:"book",color:"#cdb4e6"} },
    { id:"siwak", person:"Prophet Muhammad ﷺ", category:"prophetic", certainty:"documented", habit:"Using the siwak", summary:"A small act of cleanliness tied to each prayer.", how:"He stressed using the siwak at every prayer, and said he would have made it obligatory if it were not a hardship on his community.", results:"A simple daily act of cleanliness attached to a fixed cue, which is what makes a habit stick.", consistency:"Tied to the five daily prayers, so it repeats several times a day.", source:"Sahih al-Bukhari, Sahih Muslim", draft:{name:"Siwak",goal:"Daily tracking",target:0,unit:"",icon:"leaf",color:"#b8e0c2"} },
    { id:"mon-thu-fasting", person:"Prophet Muhammad ﷺ", category:"prophetic", certainty:"documented", habit:"Fasting Monday and Thursday", summary:"A light weekly rhythm instead of an all-or-nothing routine.", how:"He was reported to seek out fasting on these two days each week.", results:"A sustainable weekly routine that builds self-discipline.", consistency:"Weekly, so easy to keep for years.", source:"Jami` at-Tirmidhi, Sunan an-Nasa'i", draft:{name:"Fast Mon & Thu",goal:"Mon and Thu",target:0,unit:"",icon:"moon",color:"#f8c9a3"} },
    { id:"three-wills", person:"Prophet Muhammad ﷺ", category:"prophetic", certainty:"documented", habit:"Three small commitments: Duha, Witr, three fasts a month", summary:"Advice built from three light acts that fit into a busy life.", how:"Abu Hurayra reported that the Prophet ﷺ advised him to fast three days each month, pray two rakahs of Duha, and pray Witr before sleeping.", results:"Each act is small and specific, so it is easy to start and hard to find an excuse for.", consistency:"Two are daily and one is monthly. Small, fixed commitments are easier to keep than big vague ones.", source:"Sahih al-Bukhari, Sahih Muslim (Abu Hurayra)", draft:{name:"Duha prayer",goal:"Two rakahs",target:0,unit:"",icon:"sunny",color:"#f9e1a6"} },
    { id:"sleep-after-isha", person:"Prophet Muhammad ﷺ", category:"prophetic", certainty:"documented", habit:"Not staying up after Isha", summary:"A fixed end to the evening.", how:"Abu Barza al-Aslami reported that the Prophet ﷺ disliked sleeping before Isha and talking after it.", results:"A clear end to the evening leaves room for an early start the next morning.", consistency:"It repeats every night, tied to a fixed cue: the Isha prayer.", source:"Sahih al-Bukhari, Sahih Muslim (Abu Barza al-Aslami)", draft:{name:"Sleep early",goal:"Sleep after Isha",target:0,unit:"",icon:"bed",color:"#cdb4e6"} },
    { id:"ibn-umar-night-prayer", person:"Abdullah ibn Umar رضي الله عنهما", category:"companions", certainty:"documented", habit:"Turning one remark into a night habit", summary:"One sentence of encouragement became a lasting practice.", how:"The Prophet ﷺ said Abdullah would be a good man if he prayed at night. Salim reported that afterward, Abdullah slept only a little at night.", results:"He acted on the feedback immediately instead of postponing it.", consistency:"Salim describes it as his practice from then on, not a single night.", source:"Sahih al-Bukhari, Sahih Muslim (Salim from his father)", draft:{name:"Night prayer",goal:"Even a little",target:0,unit:"",icon:"moon",color:"#b6def0"} },
    { id:"buffett-reading", person:"Warren Buffett", category:"business", certainty:"reported", habit:"Reading a large part of every day", summary:"Knowledge that builds up like compound interest.", how:"He is widely reported to spend much of each day reading annual reports, newspapers and books, then thinking about what he read.", results:"He has described knowledge as something that accumulates over time, much like compound interest.", consistency:"Reported across decades of his career as a daily routine, not a one-off effort.", source:"Alice Schroeder, The Snowball, and his interviews. Verify exact wording before relying on it.", draft:{name:"Reading",goal:"30m",target:30,unit:"min",icon:"book",color:"#f8c9a3"} },
    { id:"gates-think-week", person:"Bill Gates", category:"business", certainty:"documented", habit:"Think Week and a yearly reading list", summary:"Protected time away from meetings to read and think.", how:"He has described retreating for a week at a time to read papers and articles and think about long-term questions. He also shares a book list each year.", results:"Time without meetings gave him room for long-term thinking that daily work rarely allows.", consistency:"A recurring practice over many years, with a public yearly list as a visible commitment.", source:"GatesNotes and press coverage of Think Week.", draft:{name:"Think time",goal:"30m",target:30,unit:"min",icon:"brain",color:"#cdb4e6"} },
    { id:"seinfeld-chain", person:"Jerry Seinfeld", category:"business", certainty:"reported", habit:"Do not break the chain", summary:"A red X on the calendar for every day of writing.", how:"The story goes that he marks a wall calendar with a red X for each day he writes, and the only goal is to never break the chain.", results:"It turns a huge goal into one daily question: did I do it today?", consistency:"The streak itself becomes the reward, the same idea as the Streak in this app.", source:"Brad Isaac, Lifehacker (2007). This is his account, not a direct quote from Seinfeld.", draft:{name:"Write daily",goal:"Never break the chain",target:0,unit:"",icon:"code",color:"#f9e1a6"} }
  ];

  const LABELS = { prophetic:"Prophetic", companions:"Companions", business:"Business", history:"History" };
  const COLORS = { prophetic:"#b8e0c2", companions:"#a8d8f0", business:"#f8c9a3", history:"#cdb4e6" };
  let filter = "all";
  let currentRole = null;
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function render() {
    const grid = document.getElementById("roles-grid");
    if (!grid) return;
    const shown = ROLE_MODELS.filter((role) => filter === "all" || role.category === filter);
    grid.innerHTML = shown.map((role) => `
      <article class="role-card ${role.category}" data-id="${role.id}" tabindex="0" aria-label="Read more about ${escapeHtml(role.person)}">
        <span class="role-cat">${LABELS[role.category]}</span>
        <h2 class="role-person">${escapeHtml(role.person)}</h2>
        <p class="role-habit">${escapeHtml(role.habit)}</p>
        <p class="role-summary">${escapeHtml(role.summary)}</p>
        <button class="role-open" type="button" aria-label="Read more about ${escapeHtml(role.person)}">Read more →</button>
      </article>
    `).join("");
  }

  function openRole(id) {
    const role = ROLE_MODELS.find((item) => item.id === id);
    if (!role) return;
    currentRole = role;
    document.getElementById("rd-cat").textContent = LABELS[role.category];
    document.getElementById("rd-person").textContent = role.person;
    document.getElementById("rd-habit").textContent = role.habit;
    document.getElementById("rd-how").textContent = role.how;
    document.getElementById("rd-results").textContent = role.results;
    document.getElementById("rd-consistency").textContent = role.consistency;
    document.getElementById("rd-source").textContent = role.source;
    const cert = document.getElementById("rd-cert");
    cert.textContent = role.certainty === "documented" ? "Documented" : "Reported, not confirmed";
    cert.className = `role-detail-certainty ${role.certainty}`;
    document.querySelector(".role-detail").style.setProperty("--role-detail-accent", COLORS[role.category]);
    document.getElementById("role-dialog").showModal();
  }

  function showToast(message) {
    const toast = document.getElementById("role-toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4000);
  }

  function setup() {
    document.querySelectorAll("#roles-filter button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("#roles-filter button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        filter = button.dataset.cat;
        render();
      });
    });

    const grid = document.getElementById("roles-grid");
    grid.addEventListener("click", (event) => {
      const card = event.target.closest(".role-card");
      if (card) openRole(card.dataset.id);
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const card = event.target.closest(".role-card");
        if (card) {
          event.preventDefault();
          openRole(card.dataset.id);
        }
      }
    });

    const dialog = document.getElementById("role-dialog");
    document.getElementById("rd-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.getElementById("rd-add").addEventListener("click", () => {
      if (!currentRole || typeof Data === "undefined") return;
      const draft = currentRole.draft;
      Data.addHabit({
        name:draft.name,
        icon:draft.icon,
        goal:draft.goal,
        goalType:draft.target > 0 ? "numeric" : "boolean",
        color:draft.color,
        description:`Inspired by ${currentRole.person}`
      });
      dialog.close();
      showToast(`"${draft.name}" was added to your habits.`);
    });

    const navToggle = document.getElementById("navToggle");
    const mainNav = document.getElementById("mainNav");
    const navOverlay = document.getElementById("navOverlay");
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("active");
      navOverlay.classList.toggle("active");
    });
    navOverlay.addEventListener("click", () => {
      mainNav.classList.remove("active");
      navOverlay.classList.remove("active");
    });

    render();
  }

  return { setup };
})();

document.addEventListener("DOMContentLoaded", RoleModels.setup);
