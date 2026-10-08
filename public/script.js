const signupForm = document.querySelector("#signupForm");
const loginForm = signupForm || document.querySelector("#loginForm");

if (loginForm) {
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const error = document.querySelector("#loginError");
  const button = document.querySelector("#loginButton");
  const toggle = document.querySelector("#togglePassword");

  toggle.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
    toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  if (!signupForm && new URLSearchParams(window.location.search).has("registered")) {
    error.textContent = "Account created! Sign in to continue.";
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    if (signupForm && password.value !== document.querySelector("#confirmPassword").value) {
      error.textContent = "Passwords do not match.";
      return;
    }
    button.disabled = true;
    button.textContent = signupForm ? "Creating account..." : "Signing in...";
    try {
      const response = await fetch(signupForm ? "/api/signup" : "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value,
          ...(signupForm ? { firstName: document.querySelector("#firstName").value, lastName: document.querySelector("#lastName").value } : {}) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to sign in");
      window.location.assign(signupForm ? "/login?registered=1" : "/");
    } catch (requestError) {
      error.textContent = requestError.message === "Failed to fetch"
        ? "Cannot reach the server. Please try again."
        : requestError.message;
    } finally {
      button.disabled = false;
      button.textContent = signupForm ? "Create account" : "Sign in";
    }
  });
}

const logoutButton = document.querySelector("#logoutButton");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out");
      window.location.assign("/login");
    } catch {
      welcomeMessage.textContent = "Unable to sign out. Please try again.";
    }
  });
}

// Copy Button
copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(codeInput.value);

    copyButton.textContent = "Copied!";

    setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1500);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
});

// Expected Result Field
const expected = document.getElementById("expectedEditor").value;
