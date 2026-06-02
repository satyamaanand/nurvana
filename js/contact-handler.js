// Nurvana Contact Message Submission Handler

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      if (!name || !email || !subject || !message) {
        showToast('All fields are required.', 'error');
        return;
      }

      try {
        const res = await authFetch('/contact', {
          method: 'POST',
          body: JSON.stringify({ name, email, subject, message })
        });

        if (res.success) {
          showToast('Your message has been sent successfully. We will contact you soon!', 'success');
          contactForm.reset();
        }
      } catch (err) {
        // Errors handled automatically by authFetch toast
      }
    });
  }
});
