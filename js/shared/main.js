const validationRules = {
  name: {
    regex: /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u,
    message: "Enter a valid name using letters, spaces, apostrophes, or hyphens.",
  },
  email: {
    regex:
      /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i,
    message: "Enter a valid email address.",
  },
  password: {
    regex: /^(?=.*\S).{8,}$/,
    message: "Password must be at least 8 characters long.",
  },
};

document.querySelectorAll("[data-auth-form]").forEach((form) => {
  const fields = Array.from(form.querySelectorAll("[data-validation]"));
  const password = form.querySelector('[data-validation="password"]');
  const confirmPassword = form.querySelector(
    '[data-validation="confirm-password"]',
  );
  const terms = form.querySelector("#termsCheck");

  function validateField(field) {
    const value = field.type === "password" ? field.value : field.value.trim();
    const rule = validationRules[field.dataset.validation];
    let message = "";

    if (!value) {
      message = "This field is required.";
    } else if (rule && !rule.regex.test(value)) {
      message = rule.message;
    } else if (field === confirmPassword && value !== password.value) {
      message = "Passwords do not match.";
    }

    const error = document.getElementById(field.getAttribute("aria-describedby"));
    field.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;

    return !message;
  }

  function validateTerms() {
    if (!terms) {
      return true;
    }

    const isValid = terms.checked;
    const error = document.getElementById("termsError");
    terms.classList.toggle("is-invalid", !isValid);
    terms.setAttribute("aria-invalid", String(!isValid));
    error.textContent = isValid
      ? ""
      : "You must agree to the terms and privacy policy.";

    return isValid;
  }

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        validateField(field);
      }

      if (field === password && confirmPassword?.value) {
        validateField(confirmPassword);
      }
    });
  });

  terms?.addEventListener("change", validateTerms);

  form.addEventListener("submit", (event) => {
    const fieldsAreValid = fields.map(validateField).every(Boolean);
    const termsAreValid = validateTerms();

    event.preventDefault();

    if (fieldsAreValid && termsAreValid) {
      window.location.assign("../app/habits.html");
    }
  });
});

const first = document.getElementById("first");
const last = document.getElementById("last");
const subject = document.getElementById("subject");
const email = document.getElementById("email");
const message = document.getElementById("message");

const formButton = document.getElementById("form-button");
const contactForm = document.getElementById("form");

const regexName = /^[a-z ,.'-]+$/i;

function validateInput(input, isValid) {
  input.classList.toggle("form-control-error", !isValid);
  input.nextElementSibling.classList.toggle("d-none", isValid);

  return isValid;
}

function validateName(input) {
  return validateInput(input, regexName.test(input.value.trim()));
}

function validateEmail() {
  return validateInput(
    email,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
  );
}

function validateRequired(input) {
  return validateInput(input, input.value.trim() !== "");
}

if (contactForm) {
  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const isValid = [
      validateName(first),
      validateName(last),
      validateRequired(subject),
      validateEmail(),
      validateRequired(message),
    ].every(Boolean);

    if (!isValid) {
      return;
    }

    formButton.disabled = true;
    formButton.innerText = "SENT";
    formButton.classList.add("sent");

    message.disabled = true;
    message.classList.add("form-sent");

    contactForm.querySelectorAll("input").forEach((input) => {
      input.classList.add("form-sent");
      input.disabled = true;
    });
  });
}