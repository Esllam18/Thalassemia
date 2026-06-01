/* ============================================================
   auth.js — Auth guard and session utilities
   Works correctly with both file:// and http:// protocols
   ============================================================ */

function getRoot() {
  const path = window.location.pathname;
  if (path.includes('/auth/') || path.includes('/dashboard/')) {
    return '../';
  }
  return './';
}

function goTo(relativePath) {
  window.location.href = getRoot() + relativePath;
}

/**
 * Require authenticated session.
 * Uses getUser() (hits server) instead of getSession() (reads local cache)
 * because with file:// each folder has an isolated localStorage.
 * Returns the USER object if authenticated.
 */
async function requireAuth() {
  try {
    // getUser() verifies the token server-side — works regardless of protocol
    const user = await db.auth.getUser();
    if (!user) {
      goTo('auth/login.html');
      throw new Error('Not authenticated');
    }
    // Cache user on window so page scripts can access it without a second call
    window._currentUser = user;
    return user;
  } catch (e) {
    if (e.message === 'Not authenticated') throw e;
    goTo('auth/login.html');
    throw e;
  }
}

/**
 * Require NO session (login/register pages).
 * Redirects to dashboard if already signed in.
 */
async function requireGuest() {
  try {
    const user = await db.auth.getUser();
    if (user) {
      goTo('dashboard/index.html');
    }
  } catch (e) {
    // If check fails, stay on auth page — that is safe
    console.warn('Session check failed:', e);
  }
}

/**
 * Get current user's profile from Supabase.
 * Caches result in sessionStorage (keyed by user id).
 * Will use window._currentUser set by requireAuth() to avoid extra getUser() call.
 */
async function getCurrentProfile() {
  try {
    // Prefer the user already resolved by requireAuth()
    let userId = window._currentUser?.id;

    if (!userId) {
      const user = await db.auth.getUser();
      if (!user) return null;
      userId = user.id;
      window._currentUser = user;
    }

    const cacheKey = `profile_${userId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    const { data, error } = await db.profiles.get(userId);
    if (error) {
      console.warn('Profile load error:', error.message);
      return null;
    }
    if (data) {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    }
    return data;
  } catch (e) {
    console.warn('getCurrentProfile error:', e);
    return null;
  }
}

/** Clear profile cache after profile update */
function clearProfileCache() {
  Object.keys(sessionStorage)
    .filter(k => k.startsWith('profile_'))
    .forEach(k => sessionStorage.removeItem(k));
  window._currentUser = null;
}

/** Fill in sidebar user info */
async function populateSidebarUser() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return;

    const nameEl   = document.getElementById('sidebarUserName');
    const roleEl   = document.getElementById('sidebarUserRole');
    const avatarEl = document.getElementById('sidebarAvatar');

    if (nameEl)   nameEl.textContent  = profile.full_name || profile.email || '—';
    if (roleEl)   roleEl.textContent  = profile.role || 'patient';
    if (avatarEl) {
      const initials = (profile.full_name || profile.email || 'U')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      avatarEl.textContent = initials;
    }
  } catch (e) {
    console.warn('populateSidebarUser error:', e);
  }
}

/** Sign out and go to landing page */
async function signOut() {
  try { await db.auth.signOut(); } catch (e) {}
  sessionStorage.clear();
  window._currentUser = null;
  goTo('index.html');
}
