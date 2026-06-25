import { isEmailAllowed, supabase } from "/js/auth.js";

const form = document.getElementById("login-form");
const messageEl = document.getElementById("login-message");
const successEl = document.getElementById("login-success");
const submitBtn = document.getElementById("submit-btn");
const params = new URLSearchParams(location.search);
const nextPath = params.get("next") || "/dashboard.html";

function showMessage(text, type = "ok") {
  successEl.hidden = true;
  messageEl.hidden = false;
  messageEl.textContent = text;
  messageEl.className = `login-message login-message-${type}`;
}

function showSuccess(email) {
  messageEl.hidden = true;
  successEl.hidden = false;
  document.getElementById("success-email").textContent = email;
  form.hidden = true;
}

async function finishLogin() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    location.href = nextPath.startsWith("/") ? nextPath : "/dashboard.html";
  }
}

if (!supabase) {
  showMessage(
    "Configuration Supabase manquante (supabase-config.js). Lancez node scripts/build-config.js en local.",
    "err"
  );
  form.hidden = true;
} else {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      finishLogin();
    }
  });

  finishLogin();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = new FormData(form).get("email")?.toString().trim() || "";

    if (!isEmailAllowed(email)) {
      showMessage("Cet email n'est pas autorisé pour cet espace.", "err");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours…";
    showMessage("Envoi du lien en cours…", "muted");

    const redirectTo = `${location.origin}/login.html?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Recevoir mon lien de connexion";

    if (error) {
      console.error("[login] signInWithOtp:", error);
      showMessage(
        `${error.message} — Vérifiez Supabase → Authentication → Email activé, et les Redirect URLs.`,
        "err"
      );
      return;
    }

    console.log("[login] OTP demandé:", data);
    showSuccess(email);
  });
}
