(() => {
  // Public values from Supabase > Project Settings > API. Never put the secret or service_role key here.
  const SUPABASE_URL = 'https://tthcccmqynlahhdzaroj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_r06AmFETYAEeBm3moOfzGA_PRf-VfZf';
  const TABLE = 'registrations';

  const status = document.getElementById('leadStatus');
  const tabs = Array.from(document.querySelectorAll('.lead-tab'));
  const forms = Array.from(document.querySelectorAll('.lead-form'));
  if (!status || !tabs.length || !forms.length) return;

  const messages = {
    notReady: "Registration isn't switched on yet. Please message us on WhatsApp instead.",
    consent: 'Please tick the box so we can contact you.',
    name: 'Please enter your name.',
    whatsapp: 'Please enter your WhatsApp number with country code, for example +1 555 010 1234.',
    email: 'Please enter a valid email address.',
    message: 'Please tell us briefly how we can help.',
    wait: 'Please wait a moment before sending again.',
    failed: 'Sorry, we could not save your request. Please try again or message us on WhatsApp.',
    sent: {
      whatsapp_call: 'Thank you. We will call you on WhatsApp shortly.',
      email: 'Thank you. We will email you shortly.'
    }
  };

  function show(text, kind) {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  function syncConsent(form) {
    form.querySelector('button[type="submit"]').disabled = Boolean(buildPayload(form).error);
  }

  function selectTab(tab) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    show('', '');
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  function normalizeWhatsapp(raw) {
    const digits = raw.replace(/[^\d+]/g, '');
    return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
  }

  function recentlySent() {
    try {
      return Date.now() - Number(localStorage.getItem('wys_last_submit') || 0) < 20000;
    } catch (e) {
      return false;
    }
  }

  function markSent() {
    try {
      localStorage.setItem('wys_last_submit', String(Date.now()));
    } catch (e) {
      // Storage can be blocked; the limit is a courtesy, not a requirement.
    }
  }

  function buildPayload(form) {
    const data = new FormData(form);
    const method = form.dataset.method;
    if (!data.get('consent')) return { error: messages.consent };

    if (method === 'whatsapp_call') {
      const name = String(data.get('name') || '').trim();
      const whatsapp = normalizeWhatsapp(String(data.get('whatsapp') || ''));
      if (!name || name.length > 100) return { error: messages.name };
      if (!whatsapp) return { error: messages.whatsapp };
      return { payload: { contact_method: method, name, whatsapp, consent: true } };
    }

    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: messages.email };
    if (!message || message.length > 1000) return { error: messages.message };
    return { payload: { contact_method: method, email, message, consent: true } };
  }

  async function submit(form) {
    if (new FormData(form).get('website')) {
      show(messages.sent[form.dataset.method], 'ok');
      form.reset();
      syncConsent(form);
      return;
    }

    const { payload, error } = buildPayload(form);
    if (error) return show(error, 'error');
    if (SUPABASE_URL.includes('YOUR-PROJECT') || SUPABASE_KEY.includes('YOUR-')) {
      console.warn('registration.js: set SUPABASE_URL and SUPABASE_KEY first.');
      return show(messages.notReady, 'error');
    }
    if (recentlySent()) return show(messages.wait, 'error');

    const button = form.querySelector('button[type="submit"]');
    const labelEl = button.querySelector('.btn-label') || button;
    const label = labelEl.textContent;
    button.disabled = true;
    labelEl.textContent = 'Sending...';
    button.classList.add('is-loading');
    show('', '');

    const headers = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Prefer: 'return=minimal'
    };
    if (SUPABASE_KEY.startsWith('eyJ')) headers.Authorization = 'Bearer ' + SUPABASE_KEY;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      markSent();
      form.reset();
      show(messages.sent[form.dataset.method], 'ok');
    } catch (err) {
      console.error('registration failed:', err);
      show(messages.failed, 'error');
    } finally {
      labelEl.textContent = label;
      button.classList.remove('is-loading');
      syncConsent(form);
    }
  }

  forms.forEach((form) => {
    form.addEventListener('input', () => syncConsent(form));
    form.addEventListener('change', () => syncConsent(form));
    syncConsent(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit(form);
    });
  });
})();
