/**
 * nav.js — Mobile navigation toggle
 * Handles hamburger menu open/close and closes nav on link click.
 */

(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.getElementById('navLinks');

  if (!navLinks) return;

  function toggleMenu(isOpen) {
    navLinks.classList.toggle('open', isOpen);
    if (hamburger) {
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    }
    if (mobileMenuBtn) {
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
      }
    }
  }

  // Hamburger click
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      const isOpen = !navLinks.classList.contains('open');
      toggleMenu(isOpen);
    });
  }

  // Mobile menu button (calisthenics.html)
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = !navLinks.classList.contains('open');
      toggleMenu(isOpen);
    });
  }

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggleMenu(false);
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function (e) {
    const isHamburger = hamburger && hamburger.contains(e.target);
    const isMobileBtn = mobileMenuBtn && mobileMenuBtn.contains(e.target);
    if (!navLinks.contains(e.target) && !isHamburger && !isMobileBtn) {
      toggleMenu(false);
    }
  });
})();
