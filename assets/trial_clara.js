var STORE_URL_PREFIX = 'https://get.kintone.com';
var VALIDATE_DOMAIN_URL = STORE_URL_PREFIX + '/api/open/validateSubdomain.json';

function validateSubdomain(subdomain, callbacks) {
  if (!callbacks || typeof callbacks.onSuccess !== "function" || typeof callbacks.onFailure !== "function") {
    console.error("AssertError: callbacks.onSuccess, callback.onFailure must be function");
    return;
  }

  if (!subdomain || subdomain.length === 0) {
    callbacks.onFailure();
    return;
  }

  $.ajax({
    url: VALIDATE_DOMAIN_URL,
    type: 'POST',
    data: JSON.stringify({subdomain: subdomain}),
    contentType: 'application/json; charset=utf-8'
  })
    .then(function(response) {
      if (!response) {
        return;
      }
      callbacks.onSuccess();
    })
    .catch(function(error) {
      if (error.status === 400 && error.responseJSON) {
        var response = error.responseJSON;
        var messages = response.errors.subdomain.messages;
        if (messages) {
          callbacks.onFailure(messages.join());
        }
      } else {
        callbacks.onFailure();
      }
    })
}

function validateDomainInput($form, callbacks) {
  var $domainMessageContainer = $form.find('ul[id="domain-message"]');
  if (!$domainMessageContainer[0]) {
    $form.find('input[name="domain"]').parent().parent().append('<ul id="domain-message" class="hs-error-msgs inputs-list"></ul>');
    $domainMessageContainer = $form.find('ul[id="domain-message"]');
  }

  var $domain = $form.find('input[name="domain"]');
  var value = $domain.val();

  validateSubdomain(value, {
    onSuccess: function () {
      $domainMessageContainer.empty();
      $domainMessageContainer.append('<li><label>Available</label></li>');
      $form.find(':input[type="submit"]').prop('disabled', false);

      if (callbacks && typeof callbacks.onSuccess) {
        callbacks.onSuccess();
      }
    },
    onFailure: function (message) {
      $domainMessageContainer.empty();
      if (message) {
        $domainMessageContainer.append('<li><label>' + message + '</label></li>');
      }
      $form.find(':input[type="submit"]').prop('disabled', true);

      if (callbacks && typeof callbacks.onFailure) {
        callbacks.onFailure();
      }
    }
  })
}

function findPlane(){
  var host = window.location.host;
  var parts = host.split(".");
  if(parts.length == 3) {
    return "master";
  } else {
    return parts[1];
  }
}

function setup($form) {
  var $submit = $form.find('input[type="submit"]');
  $submit.prop('disabled', true);

  var isValidSubdomain = false;
  var $domain = $form.find('input[name="domain"]');
  $domain.change(function() { validateDomainInput($form, {
    onSuccess: function() { isValidSubdomain = true },
    onFailure: function() { isValidSubdomain = false }
  }); });
  $domain.on('input', function () { isValidSubdomain = false });

  var hubspotForm = document.getElementById("hubspotform");
  hubspotForm.addEventListener("submit", function(e) {
    if (!isValidSubdomain) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true)

  var $plane = $form.find('input[name="plane"]');
  $plane.val(findPlane());
}