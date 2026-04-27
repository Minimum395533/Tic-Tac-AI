// --- 1. UI STATE MANAGEMENT ---
// Helper to hide/show forms on login.html
const showSection = (sectionId) => {
  // Notice 'choice' is REMOVED from this list so it never gets hidden
  const sections = ['login-form', 'signup-form', 'success', 'Logged-in'];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden'); 
  });

  // If a valid sectionId is passed, reveal it
  if (sectionId) {
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('hidden'); 
  }
};

// --- 2. AUTHENTICATION (PRO-TIP CHECK) ---
const checkAuth = async () => {
  try {
    const response = await fetch('/api/me');
    const loginTab = document.getElementById('Login-tab'); // Found on index.html
    const loggedInDiv = document.getElementById('Logged-in');

    if (response.ok) {
      const user = await response.json();
      // LOGGED IN: Hide login links, show personalized greeting
      if (loginTab) loginTab.classList.add('hidden');
      if (loggedInDiv) {
        loggedInDiv.classList.remove('hidden');
        loggedInDiv.innerHTML = `<p>Hello, ${user.username}! `;
      }
    } else {
      // NOT LOGGED IN: Ensure the personalized greeting is hidden
      if (loginTab) loginTab.classList.remove('hidden');
      if (loggedInDiv) loggedInDiv.classList.add('hidden');
    }
  } catch (error) {
    console.error("Auth check failed", error);
  }
};

// --- 3. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Run auth check to handle the "Hello {username}" visibility
  checkAuth();

  // 2. INITIAL STATE: Hide all forms, leaving ONLY the #choice buttons visible
  showSection(null);

  // 3. Handle Choice Buttons: Swap between login and signup forms
  document.getElementById('login')?.addEventListener('click', () => showSection('login-form'));
  document.getElementById('signup')?.addEventListener('click', () => showSection('signup-form'));

  // --- HANDLE SIGNUP ---
  document.getElementById('submit-signup')?.addEventListener('click', async () => {
    const username = document.getElementById('username-new').value;
    const password = document.getElementById('password-new').value;
    const confirm = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('error-signup');

    // Frontend Check: Passwords match
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
      showSection('success'); 
      errorEl.innerText = "";
    } else {
      const msg = await res.text();
      errorEl.innerText = msg;
    }
  });

  // --- HANDLE LOGIN ---
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
      // Reveal the Logged-in div
      showSection('Logged-in'); 

      // Dynamically inject the username they just typed into the greeting
      const loggedInDiv = document.getElementById('Logged-in');
      if (loggedInDiv) {
        loggedInDiv.innerHTML = `<p>Hello, ${username}! Go to <a href="index.html">Home</a></p>`;
      }
    } else {
      errorEl.innerText = "Invalid username or password.";
    }
  });
});