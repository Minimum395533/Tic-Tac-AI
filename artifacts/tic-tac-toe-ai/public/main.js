// --- 1. UI STATE MANAGEMENT ---
// Helper to hide/show forms on login.html
const toggleForm = (showId) => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const choiceDiv = document.getElementById('choice');

  // Assuming you have a .hidden class in CSS: .hidden { display: none; }
  if (loginForm) loginForm.classList.add('hidden');
  if (signupForm) signupForm.classList.add('hidden');

  const target = document.getElementById(showId);
  if (target) target.classList.remove('hidden');
};

// --- 2. AUTHENTICATION (PRO-TIP CHECK) ---
const checkAuth = async () => {
  const response = await fetch('/api/me');
  const loginTab = document.getElementById('Login-tab');
  const loggedInDiv = document.getElementById('Logged-in');

  if (response.ok) {
    const user = await response.json();
    if (loginTab) loginTab.classList.add('hidden');
    if (loggedInDiv) {
      loggedInDiv.classList.remove('hidden');
      loggedInDiv.innerText = `Hello, ${user.username}`;
    }
  } else {
    if (loginTab) loginTab.classList.remove('hidden');
    if (loggedInDiv) loggedInDiv.classList.add('hidden');
  }
};

// --- 3. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  // Check auth immediately on page load
  checkAuth();

  // Handle Choice Buttons
  document.getElementById('login')?.addEventListener('click', () => toggleForm('login-form'));
  document.getElementById('signup')?.addEventListener('click', () => toggleForm('signup-form'));

  // Handle Signup Submit
  document.getElementById('submit-signup')?.addEventListener('click', async () => {
    const username = document.getElementById('username-new').value;
    const password = document.getElementById('password-new').value;
    const confirm = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('error-signup');

    // Edge Case: Password Mismatch (Frontend Check)
    if (password !== confirm) {
      errorEl.innerText = "Passwords do not match!";
      return;
    }

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      document.getElementById('success').classList.remove('hidden');
      errorEl.innerText = "";
    } else {
      const msg = await res.text();
      errorEl.innerText = msg;
    }
  });

  // Handle Login Submit
  document.getElementById('submit-login')?.addEventListener('click', async () => {
    const username = document.getElementById('username-login').value;
    const password = document.getElementById('password-login').value;
    const errorEl = document.getElementById('error-login');

    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      window.location.href = 'index.html'; // Redirect on success
    } else {
      errorEl.innerText = "Invalid username or password.";
    }
  });
});