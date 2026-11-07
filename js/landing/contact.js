const first = document.getElementById("first");
const last = document.getElementById("last");
const subject = document.getElementById("subject");
const email = document.getElementById("email");
const message = document.getElementById("message");

const formButton = document.getElementById("form-button");
const form = document.getElementById("form");

const regexName = /^[a-z ,.'-]+$/i;

// Validate an input and show/hide its error span
function validateInput(input, isValid) {
  input.classList.toggle("form-control-error", !isValid);
  input.nextElementSibling.classList.toggle("d-none", isValid);

  return isValid;
}

// Validate name fields
function validateName(input) {
  return validateInput(input, regexName.test(input.value.trim()));
}

// Validate email
function validateEmail() {
  return validateInput(
    email,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
  );
}

// Validate required fields
function validateRequired(input) {
  return validateInput(input, input.value.trim() !== "");
}

// Form submission
form.addEventListener("submit", function (event) {
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

  // Form is valid
  formButton.disabled = true;
  formButton.innerText = "SENT";
  formButton.classList.add("sent");

  message.disabled = true;
  message.classList.add("form-sent");

  form.querySelectorAll("input").forEach((input) => {
    input.classList.add("form-sent");
    input.disabled = true;
  });
});
