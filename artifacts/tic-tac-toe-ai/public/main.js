// --- 1. UI STATE MANAGEMENT ---
// Helper to hide/show forms on login.html
const showSection = (sectionId) => {
  const sections = ['login-form', 'signup-form', 'success', 'Logged-in'];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden'); 
  });

  if (sectionId) {
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('hidden'); 
  }
};

// --- 2. LOGIN STATE PERSISTENCE ---
const LOGIN_KEY = 'ticTacToeLogin';

// Save login state to localStorage (forever)
const saveLoginState = (username) => {
  localStorage.setItem(LOGIN_KEY, JSON.stringify({ username }));
};

// Check if login state is valid
const isLoggedIn = () => {
  const stored = localStorage.getItem(LOGIN_KEY);
  if (!stored) return false;
  
  try {
    const loginData = JSON.parse(stored);
    return loginData && loginData.username;
  } catch {
    return false;
  }
};

// Get stored username if logged in
const getLoggedInUsername = () => {
  const stored = localStorage.getItem(LOGIN_KEY);
  if (!stored) return null;
  
  try {
    const loginData = JSON.parse(stored);
    return loginData.username;
  } catch {
    return null;
  }
};

// Clear login state
const clearLoginState = () => {
  localStorage.removeItem(LOGIN_KEY);
};

// --- 3. AUTHENTICATION ---
const updateAuthUI = (username) => {
  const loginTab = document.getElementById('Login-tab');
  const loggedInDiv = document.getElementById('Logged-in');
  const usernameGreeting = document.getElementById('username-greeting');

  if (username) {
    if (loginTab) loginTab.classList.add('hidden');
    if (loggedInDiv) loggedInDiv.classList.remove('hidden');
    if (usernameGreeting) usernameGreeting.textContent = `Hello, ${username}!`;
  } else {
    if (loginTab) loginTab.classList.remove('hidden');
    if (loggedInDiv) loggedInDiv.classList.add('hidden');
  }
};

const checkAuth = async () => {
  try {
    // Check localStorage first
    const username = getLoggedInUsername();
    
    if (username) {
      updateAuthUI(username);
      return;
    }

    // Fallback to server check
    const response = await fetch('/api/me');
    
    if (response.ok) {
      const user = await response.json();
      updateAuthUI(user.username);
      // Save to localStorage for persistence
      saveLoginState(user.username);
    } else {
      updateAuthUI(null);
      clearLoginState();
    }
  } catch (error) {
    console.error("Auth check failed", error);
  }
};

// --- 4. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Run auth check to handle the UI visibility
  checkAuth();

  // 2. Only run login page logic if on login.html
  if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/login')) {
    // INITIAL STATE: Hide all forms, leaving ONLY the #choice buttons visible
    showSection(null);

    // Handle Choice Buttons: Swap between login and signup forms
    document.getElementById('login')?.addEventListener('click', () => showSection('login-form'));
    document.getElementById('signup')?.addEventListener('click', () => showSection('signup-form'));

    // --- HANDLE SIGNUP ---
    document.getElementById('submit-signup')?.addEventListener('click', async () => {
      const username = document.getElementById('username-new').value;
      const password = document.getElementById('password-new').value;
      const confirm = document.getElementById('confirm-password').value;
      const errorEl = document.getElementById('error-signup');

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
        // Save login state forever
        saveLoginState(username);
        
        // Reveal the Logged-in div
        showSection('Logged-in'); 

        // Inject the username into the greeting
        const loggedInDiv = document.getElementById('Logged-in');
        const usernameGreeting = document.getElementById('username-greeting');
        if (loggedInDiv) loggedInDiv.classList.remove('hidden');
        if (usernameGreeting) usernameGreeting.textContent = `Hello, ${username}! Go to <a href="index.html">Home</a>`;
      } else {
        errorEl.innerText = "Invalid username or password.";
      }
    });
  }

  // --- HANDLE SIGN OUT (on all pages) ---
  document.getElementById('signout-button')?.addEventListener('click', () => {
    clearLoginState();
    updateAuthUI(null);
    // Redirect to login page or refresh
    window.location.href = 'login.html';
  });
});
