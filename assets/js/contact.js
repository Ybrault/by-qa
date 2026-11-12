var CONTACT_ENDPOINT = 'https://api.web3forms.com/submit';

async function submitContact(form) {
  var payload = {};
  new FormData(form).forEach(function (value, key) { payload[key] = value; });
  try {
    var res = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    var json = await res.json();
    return { ok: res.ok && json.success === true };
  } catch (e) {
    return { ok: false };
  }
}

(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form || !status) return;
  var button = form.querySelector('button[type=submit]');
  document.documentElement.classList.add('form-ready');
  var sending = false;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending) return;
    if (!form.reportValidity()) return;
    sending = true;
    button.disabled = true;
    status.textContent = form.dataset.msgSending;
    var result = await submitContact(form);
    if (result.ok) {
      form.reset();
      status.textContent = form.dataset.msgOk;
    } else {
      status.textContent = form.dataset.msgError;
    }
    sending = false;
    button.disabled = false;
  });
})();
