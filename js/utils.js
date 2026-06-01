/* ============================================================
   utils.js — Shared helper functions
   ============================================================ */

/* ---- Risk / Score helpers ---- */

function getRiskCategory(score) {
  if (score <= 2) return 'Normal';
  if (score <= 4) return 'Borderline';
  if (score <= 6) return 'Possible';
  if (score <= 8) return 'Likely';
  return 'Strong';
}

function getRiskChipClass(score) {
  if (score <= 2) return 'chip-normal';
  if (score <= 4) return 'chip-borderline';
  if (score <= 6) return 'chip-possible';
  if (score <= 8) return 'chip-likely';
  return 'chip-strong';
}

function getRiskColor(score) {
  if (score <= 2) return 'var(--risk-normal)';
  if (score <= 4) return 'var(--risk-borderline)';
  if (score <= 6) return 'var(--risk-possible)';
  if (score <= 8) return 'var(--risk-likely)';
  return 'var(--risk-strong)';
}

function scoreChip(score, label) {
  if (score == null) return '<span class="chip chip-brand">—</span>';
  const cat = label || getRiskCategory(score);
  const cls = getRiskChipClass(score);
  return `<span class="chip ${cls}">${cat} (${score})</span>`;
}

/* ---- Date formatting ---- */

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

/* ---- Alert helpers ---- */

function showAlert(containerId, type, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️', warn: '⚡' };
  el.innerHTML = `
    <div class="alert alert-${type}">
      <span class="alert-icon">${icons[type] || 'ℹ️'}</span>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}

/* ---- Security ---- */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---- Loading state ---- */

function setLoading(btnId, loading, loadingText = 'Loading…') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._originalText || 'Submit';
    btn.disabled = false;
  }
}

/* ---- Number helpers ---- */

function roundNum(n, decimals = 2) {
  return n != null ? Number(n).toFixed(decimals) : '—';
}

function percent(n) {
  return n != null ? Math.round(n * 100) + '%' : '—';
}

/* ---- Theme ---- */

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  // update toggle icon
  const icons = document.querySelectorAll('.theme-icon');
  icons.forEach(el => { el.textContent = theme === 'dark' ? '☀️' : '🌙'; });
}

function initTheme() {
  setTheme(getTheme());
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

/* ---- API error messages ---- */

function apiErrorMessage(err) {
  if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed'))) {
    // CORS or network failure — the most common cause when running from file://
    // is that the API's ALLOWED_ORIGINS does not include "null" (the file:// origin).
    return (
      'Cannot reach the AI service. ' +
      'If you are opening these files directly (file://), make sure the Railway ' +
      'ALLOWED_ORIGINS variable includes your origin, or set it to "*". ' +
      'Check the browser Console (F12) for a CORS error for details.'
    );
  }
  if (err && err.status) {
    if (err.status === 422) return 'Invalid values. Please check your CBC data.';
    if (err.status === 503) return 'AI service is temporarily unavailable. Try again shortly.';
    if (err.status === 413) return 'File too large. Maximum size is 10 MB.';
    if (err.status === 415) return 'File type not supported.';
    if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
  }
  if (err && err.detail) return err.detail;
  if (err && err.message) return err.message;
  return 'An unexpected error occurred. Please try again.';
}
