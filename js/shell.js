/* ============================================================
   shell.js — Dashboard shell (sidebar, theme, mobile nav)
   Include on every dashboard page AFTER supabase.js + auth.js
   ============================================================ */

// Expose a promise that page scripts can await to get the current user
// without triggering another auth round-trip.
window._shellReady = (async () => {
  // 1. Init theme immediately (no flash)
  initTheme();

  // 2. Auth guard — sets window._currentUser on success
  let currentUser = null;
  try {
    currentUser = await requireAuth();
  } catch (e) {
    return null; // requireAuth already redirected
  }

  // 3. Populate sidebar user info (uses cached window._currentUser)
  await populateSidebarUser();

  // 4. Mark active sidebar link
  const currentPath = window.location.pathname.toLowerCase();
  document.querySelectorAll('.sidebar-item[data-path]').forEach(el => {
    const itemPath = el.dataset.path.toLowerCase();
    if (currentPath.includes(itemPath)) {
      el.classList.add('active');
    }
  });

  // 5. Mobile sidebar toggle
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const mobileBtn = document.getElementById('mobileMenuBtn');

  mobileBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  });

  // 6. Theme toggle buttons
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => toggleTheme());
  });

  // 7. Sign out button
  document.getElementById('signOutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
  });

  return currentUser;
})();
