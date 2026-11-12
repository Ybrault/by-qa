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
  var sending = false;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending) return;
    if (!form.reportValidity()) return;
    sending = true;
    button.disabled = true;
    status.textContent = 'Envoi en cours…';
    var result = await submitContact(form);
    if (result.ok) {
      form.reset();
      status.textContent = 'Merci, votre message est bien parti. Je vous réponds rapidement.';
    } else {
      status.textContent = "Le message n'a pas pu être envoyé. Réessayez ou écrivez-moi sur LinkedIn.";
    }
    sending = false;
    button.disabled = false;
  });
})();
