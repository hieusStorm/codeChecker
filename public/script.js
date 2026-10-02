const loginForm = document.querySelector("#loginForm");

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

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    button.disabled = true;
    button.textContent = "Signing in...";
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to sign in");
      window.location.assign("/");
    } catch (requestError) {
      error.textContent = requestError.message === "Failed to fetch"
        ? "Cannot reach the server. Please try again."
        : requestError.message;
    } finally {
      button.disabled = false;
      button.textContent = "Sign in";
    }
  });
}

const logoutButton = document.querySelector("#logoutButton");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.assign("/login");
  });
}

const welcomeMessage = document.querySelector("#welcomeMessage");
if (welcomeMessage) {
  fetch("/api/me", { cache: "no-store" })
    .then(async (response) => {
      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Unable to load your account");
      const { user } = await response.json();
      const name = user.firstName || user.username || user.email;
      welcomeMessage.textContent = `Welcome, ${name}!`;
      if (logoutButton) {
        logoutButton.textContent = ((user.firstName?.[0] || name[0]) + (user.lastName?.[0] || "")).toUpperCase();
        logoutButton.title = `Log out ${name}`;
      }
    })
    .catch(() => { welcomeMessage.textContent = "Unable to load your welcome message. Please refresh to try again."; });
}
