const Profile = (() => {
  const PROFILE_STORAGE_KEY = "habitrack_profile";
  const THEME_STORAGE_KEY = "habitrack_theme";
  const HABITS_STORAGE_KEY = "habitrack_habits";
  const DEFAULT_AVATAR = "../../assets/images/optimized/profile.jpg";
  const DEFAULT_PROFILE = {
    name: "username",
    email: "",
    avatar: DEFAULT_AVATAR,
  };
  const profileWrapper = document.getElementById("profileWrapper");
  const profileToggle = document.getElementById("profileToggle");
  const profileMenu = document.getElementById("profileMenu");
  let startupStorageNotice = "";
  let toastTimer;
  let profile = loadProfile();
  let selectedAvatar = profile.avatar;
  let bodyOverflowBeforeDialog = "";

  const dialogMarkup = `
    <div class="modal-overlay profile-overlay" data-profile-overlay="profile" aria-hidden="true">
      <section class="modal-container profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profileDialogTitle" tabindex="-1">
        <div class="modal-header">
          <h2 id="profileDialogTitle">Profile</h2>
          <button class="btn-close-modal" type="button" data-close-profile-dialog aria-label="Close profile window">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
        <form class="habit-form" id="profileForm">
          <div class="profile-avatar-editor">
            <img class="profile-avatar-preview" id="profileAvatarPreview" src="${DEFAULT_AVATAR}" alt="Profile photo preview" />
            <div class="profile-avatar-controls">
              <label class="profile-upload-button" for="profileAvatarInput">Change photo</label>
              <input class="profile-avatar-input" type="file" id="profileAvatarInput" accept="image/png,image/jpeg,image/webp,image/gif" />
              <span class="profile-help-text">PNG, JPG, WEBP or GIF. Up to 1 MB.</span>
            </div>
          </div>
          <div class="form-group">
            <label for="profileName">Username</label>
            <input class="form-control" type="text" id="profileName" name="name" maxlength="40" autocomplete="nickname" required />
          </div>
          <div class="form-group">
            <label for="profileEmail">Email address</label>
            <input class="form-control" type="email" id="profileEmail" name="email" maxlength="254" autocomplete="email" />
          </div>
          <p class="profile-feedback" id="profileFeedback" role="status" aria-live="polite"></p>
          <button class="btn-submit-habit" type="submit">Save profile</button>
        </form>

        <section class="profile-password-section" aria-labelledby="passwordSectionTitle">
          <h3 id="passwordSectionTitle">Change password</h3>
          <p class="profile-help-text">This demo has no secure server, so password changes are for display only and will not be saved.</p>
          <form class="habit-form" id="passwordForm">
            <div class="form-group">
              <label for="newPassword">New password</label>
              <input class="form-control" type="password" id="newPassword" autocomplete="new-password" minlength="8" required />
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm new password</label>
              <input class="form-control" type="password" id="confirmPassword" autocomplete="new-password" minlength="8" required />
            </div>
            <p class="profile-feedback" id="passwordFeedback" role="status" aria-live="polite"></p>
            <button class="profile-secondary-button" type="submit">Preview password change</button>
          </form>
        </section>

        <section class="profile-danger-zone" aria-labelledby="deleteAccountTitle">
          <div>
            <h3 id="deleteAccountTitle">Delete local account</h3>
            <p class="profile-help-text">This removes your saved profile and habits from this browser.</p>
          </div>
          <button class="profile-delete-button" id="deleteAccountButton" type="button">Delete account</button>
        </section>
      </section>
    </div>

    <div class="modal-overlay profile-overlay" data-profile-overlay="settings" aria-hidden="true">
      <section class="modal-container profile-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsDialogTitle" tabindex="-1">
        <div class="modal-header">
          <h2 id="settingsDialogTitle">Settings</h2>
          <button class="btn-close-modal" type="button" data-close-profile-dialog aria-label="Close settings window">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
        <div class="profile-setting-row">
          <div>
            <h3>Appearance</h3>
            <p class="profile-help-text">Choose a light or dark app theme. Your choice is saved on this device.</p>
          </div>
          <button class="profile-secondary-button" type="button" data-theme-toggle>Switch theme</button>
        </div>
        <p class="profile-feedback" id="settingsFeedback" role="status" aria-live="polite"></p>
        <div class="profile-future-card">
          <h3>Theme collections</h3>
          <p class="profile-help-text">Custom theme collections are on hold for a future update.</p>
        </div>
      </section>
    </div>

    <div class="modal-overlay profile-overlay" data-profile-overlay="themes" aria-hidden="true">
      <section class="modal-container profile-dialog" role="dialog" aria-modal="true" aria-labelledby="themesDialogTitle" tabindex="-1">
        <div class="modal-header">
          <h2 id="themesDialogTitle">Your themes</h2>
          <button class="btn-close-modal" type="button" data-close-profile-dialog aria-label="Close themes window">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
        <div class="profile-future-card">
          <ion-icon name="color-palette-outline" aria-hidden="true"></ion-icon>
          <h3>Theme collections are on hold</h3>
          <p class="profile-help-text">This space is reserved for future themes. You can still switch between light and dark mode with the theme button.</p>
        </div>
      </section>
    </div>
    <p class="profile-toast" id="profileToast" role="status" aria-live="polite"></p>
  `;

  function isValidAvatar(value) {
    return (
      value === DEFAULT_AVATAR ||
      (typeof value === "string" &&
        /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(
          value,
        ))
    );
  }

  function loadProfile() {
    try {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!savedProfile) {
        return { ...DEFAULT_PROFILE };
      }

      const parsed = JSON.parse(savedProfile);
      if (!parsed || typeof parsed !== "object") {
        throw new TypeError("Saved profile data must be an object.");
      }

      return {
        name:
          typeof parsed.name === "string" && parsed.name.trim()
            ? parsed.name.trim().slice(0, 40)
            : DEFAULT_PROFILE.name,
        email:
          typeof parsed.email === "string" ? parsed.email.slice(0, 254) : "",
        avatar: isValidAvatar(parsed.avatar) ? parsed.avatar : DEFAULT_AVATAR,
      };
    } catch (error) {
      console.error("Could not load the saved HabitRack profile:", error);
      startupStorageNotice =
        "Could not read the saved profile from this browser.";
      return { ...DEFAULT_PROFILE };
    }
  }

  function showToast(message) {
    const toast = document.getElementById("profileToast");
    if (!toast) {
      return;
    }

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.textContent = "";
    }, 4500);
  }

  function setFeedback(id, message, state = "info") {
    const feedback = document.getElementById(id);
    if (!feedback) {
      return;
    }
    feedback.textContent = message;
    feedback.dataset.state = state;
  }

  function renderProfile() {
    const name = profile.name || DEFAULT_PROFILE.name;
    document.querySelectorAll("#profileDisplayName").forEach((element) => {
      element.textContent = name;
    });
    document.querySelectorAll("#profilePhoto").forEach((image) => {
      image.src = profile.avatar;
      image.alt = `${name}'s profile photo`;
    });

    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const preview = document.getElementById("profileAvatarPreview");
    if (nameInput) nameInput.value = profile.name;
    if (emailInput) emailInput.value = profile.email;
    if (preview) preview.src = profile.avatar;
  }

  function saveProfile(nextProfile) {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      profile = nextProfile;
      selectedAvatar = profile.avatar;
      renderProfile();
      setFeedback(
        "profileFeedback",
        "Profile saved on this device.",
        "success",
      );
      return true;
    } catch (error) {
      console.error("Could not save the HabitRack profile:", error);
      setFeedback(
        "profileFeedback",
        "Could not save your profile. Check available browser storage and try again.",
        "error",
      );
      return false;
    }
  }

  function applyTheme(theme, persist = false) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const targetTheme = nextTheme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Switch to ${targetTheme} mode`);
      button.title = `Switch to ${targetTheme} mode`;
      const icon = button.querySelector("ion-icon");
      if (icon) {
        icon.name = targetTheme === "light" ? "sunny-outline" : "moon-outline";
      } else {
        button.textContent = `Switch to ${targetTheme} mode`;
      }
    });

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {
        console.error("Could not save the HabitRack theme:", error);
        showToast("Theme changed, but could not be saved in browser storage.");
      }
    }
  }

  function loadTheme() {
    try {
      applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || "dark");
    } catch (error) {
      console.error("Could not load the saved HabitRack theme:", error);
      startupStorageNotice ||=
        "Could not read the saved theme from this browser.";
      applyTheme("dark");
    }
  }

  function closeMenu() {
    if (!profileToggle || !profileMenu) {
      return;
    }
    profileToggle.setAttribute("aria-expanded", "false");
    profileMenu.classList.remove("is-open");
    profileMenu.setAttribute("aria-hidden", "true");
  }

  function openMenu() {
    if (!profileToggle || !profileMenu) {
      return;
    }
    profileToggle.setAttribute("aria-expanded", "true");
    profileMenu.classList.add("is-open");
    profileMenu.setAttribute("aria-hidden", "false");
  }

  function closeDialog(restoreFocus = true) {
    const activeOverlays = document.querySelectorAll(
      "[data-profile-overlay].active",
    );
    if (!activeOverlays.length) {
      return;
    }

    activeOverlays.forEach((overlay) => {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = bodyOverflowBeforeDialog;
    if (restoreFocus && profileToggle) {
      profileToggle.focus();
    }
  }

  function openDialog(name) {
    closeMenu();
    closeDialog(false);
    const overlay = document.querySelector(`[data-profile-overlay="${name}"]`);
    if (!overlay) {
      return;
    }

    if (name === "profile") {
      selectedAvatar = profile.avatar;
      document.getElementById("profileAvatarInput").value = "";
      setFeedback("profileFeedback", "");
      setFeedback("passwordFeedback", "");
      document.getElementById("passwordForm").reset();
      renderProfile();
    }

    bodyOverflowBeforeDialog = document.body.style.overflow;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    overlay.querySelector("[data-close-profile-dialog]")?.focus();
    document.body.style.overflow = "hidden";
  }

  function handleAvatarChange(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 1_000_000
    ) {
      setFeedback(
        "profileFeedback",
        "Choose a PNG, JPG, WEBP or GIF image smaller than 1 MB.",
        "error",
      );
      event.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string" || !isValidAvatar(reader.result)) {
        setFeedback(
          "profileFeedback",
          "Could not use that image file.",
          "error",
        );
        return;
      }
      selectedAvatar = reader.result;
      const preview = document.getElementById("profileAvatarPreview");
      if (preview) preview.src = selectedAvatar;
      setFeedback(
        "profileFeedback",
        "Photo ready. Save your profile to keep it.",
      );
    });
    reader.addEventListener("error", () => {
      setFeedback(
        "profileFeedback",
        "Could not read that image file.",
        "error",
      );
    });
    reader.readAsDataURL(file);
  }

  function setupDialogs() {
    renderProfile();

    document.querySelectorAll("[data-profile-overlay]").forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          closeDialog();
        }
      });
    });

    document
      .querySelectorAll("[data-close-profile-dialog]")
      .forEach((button) => {
        button.addEventListener("click", () => closeDialog());
      });

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
      });
    });

    document
      .getElementById("profileAvatarInput")
      ?.addEventListener("change", handleAvatarChange);

    document
      .getElementById("profileForm")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.getElementById("profileName").value.trim();
        const email = document.getElementById("profileEmail").value.trim();
        if (!name) {
          setFeedback("profileFeedback", "Enter a username.", "error");
          return;
        }
        saveProfile({ name, email, avatar: selectedAvatar });
      });

    document
      .getElementById("passwordForm")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        const password = document.getElementById("newPassword");
        const confirmation = document.getElementById("confirmPassword");
        if (password.value !== confirmation.value) {
          setFeedback(
            "passwordFeedback",
            "The passwords do not match.",
            "error",
          );
          return;
        }
        event.currentTarget.reset();
        setFeedback(
          "passwordFeedback",
          "Password changes are UI-only in this demo and were not saved.",
        );
      });

    document
      .getElementById("deleteAccountButton")
      ?.addEventListener("click", () => {
        const confirmed = window.confirm(
          "Delete the saved profile and habits from this browser? This cannot be undone.",
        );
        if (!confirmed) {
          return;
        }

        try {
          localStorage.removeItem(HABITS_STORAGE_KEY);
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          window.location.assign("../auth/signup.html");
        } catch (error) {
          console.error("Could not delete the local HabitRack account:", error);
          setFeedback(
            "profileFeedback",
            "Could not delete saved data from this browser.",
            "error",
          );
        }
      });
  }

  function setupMenu() {
    profileToggle?.addEventListener("click", () => {
      if (profileToggle.getAttribute("aria-expanded") === "true") {
        closeMenu();
      } else {
        openMenu();
      }
    });

    profileMenu?.addEventListener("click", (event) => {
      const action = event.target.closest("[data-profile-action]")?.dataset
        .profileAction;
      if (!action) {
        return;
      }

      closeMenu();
      if (action === "signout") {
        window.location.assign("../auth/login.html");
      } else {
        openDialog(action);
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (profileWrapper && !profileWrapper.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        closeDialog();
      }
    });
  }

  function init() {
    loadTheme();
    document.body.insertAdjacentHTML("beforeend", dialogMarkup);
    applyTheme(document.documentElement.dataset.theme);
    setupDialogs();
    setupMenu();
    if (startupStorageNotice) {
      showToast(startupStorageNotice);
    }
  }

  return { init };
})();

Profile.init();
