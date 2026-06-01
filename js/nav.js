/* nav.js — Landing page navigation */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');

  burger?.addEventListener('click', () => {
    mobile?.classList.toggle('open');
  });

  // Close mobile nav on link click
  mobile?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobile.classList.remove('open'));
  });
});
