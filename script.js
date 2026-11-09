const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Keep the "What you receive" headers the same height when shown side by side
const receiveSummaries = document.querySelectorAll('.receive-cols .receive-summary');

function equalizeReceiveSummaries() {
  receiveSummaries.forEach((el) => { el.style.minHeight = ''; });
  if (!window.matchMedia('(min-width: 1024px)').matches) return;
  const tallest = Math.max(...Array.from(receiveSummaries, (el) => el.offsetHeight));
  receiveSummaries.forEach((el) => { el.style.minHeight = `${tallest}px`; });
}

if (receiveSummaries.length) {
  equalizeReceiveSummaries();
  window.addEventListener('resize', equalizeReceiveSummaries);
  if (document.fonts) document.fonts.ready.then(equalizeReceiveSummaries);
}
