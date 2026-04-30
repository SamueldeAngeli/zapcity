const navToggle = document.querySelector('[data-nav-toggle]');
const navMenu = document.querySelector('[data-nav-menu]');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('is-open');
  });
}

document.querySelectorAll('[data-copy-value]').forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy-value');
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      const original = button.textContent;
      button.textContent = 'Copiado';
      setTimeout(() => {
        button.textContent = original;
      }, 1800);
    } catch (error) {
      console.error('Falha ao copiar para a área de transferência.', error);
    }
  });
});
