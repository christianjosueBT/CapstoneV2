// ***************************************
// ********** UTILITY FUNCTIONS **********
// ***************************************

/**
 * Adds an alert element to the DOM.
 * @param {string} message The message to be displayed on the alert
 * @param {string} type The type of alert to make
 * @returns {void} Retuns nothing
 */
const alert = (message, type) => {
  let alerts = document.querySelector('.alerts');

  let alertEl = document.createElement('div');
  alertEl.classList = `alert alert-${type}`;
  alertEl.setAttribute('role', 'alert');
  alertEl.innerHTML = `${message}<button type="button" class="btn-close alert-dismissible fade show" data-bs-dismiss="alert" aria-label="Close"></button>`;

  alerts.appendChild(alertEl);
};

/**
 * Adds Bootstrap validation on forms on submit
 * @returns {void} Retuns nothing
 */
const validateForm = () => {
  'use strict';

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  let forms = document.querySelectorAll('.needs-validation');

  // Loop over them and prevent submission
  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener(
      'submit',
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add('was-validated');
      },
      false
    );
  });
};

/**
 * Checks if we have an expired token response from the server
 * @returns {boolean} true if we have an expired token response from the server
 */
const checkExpiredToken = () => {
  if (window.performance && performance.getEntriesByType) {
    // avoid error in Safari 10, IE9- and other old browsers
    let navTiming = performance.getEntriesByType('navigation');
    if (navTiming.length > 0) {
      // still not supported as of Safari 14...
      let serverTiming = navTiming[0].serverTiming;
      if (serverTiming && serverTiming.length > 0) {
        // if this status is found, we know we have an expired token
        if (
          serverTiming[0].name === 'status' &&
          serverTiming[0].description === '418'
        ) {
          return true;
        } else return false;
      } else return false;
    }
  }
};

/**
 * Tries to fetch a new access token from the server. Reloads the page if a true
 * boolean value is passed in.
 * @param {boolean} reload Whether to reload the page
 * @returns {void} Returns nothing.
 */
const fetchToken = async reload => {
  const fetchOptions = {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const response = await fetch(
    'https://10.0.0.154:2000/api/v1/users/refresh',
    fetchOptions
  );

  if (reload && response.ok) {
    return window.location.reload();
  } else return;
};

/**
 * Makes a post request to the specified URL using the provided form data
 * @param {string} url The url we will fetch from
 * @param {FormData Object} formData The date from the form
 * @returns {response} Returns either a response json object or an error
 */
const postFormDataAsJson = async ({ url, formData }) => {
  const plainFormData = Object.fromEntries(formData.entries());
  const formDataJsonString = JSON.stringify(plainFormData);

  const fetchOptions = {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: formDataJsonString,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorMessage = await response.text();
    if (JSON.parse(errorMessage).error.name === 'TokenExpiredError') {
      await fetchToken(false);
      return postFormDataAsJson({ url, formData });
    } else throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Logs a user out of the application. If successful, we redirect to the home page.
 * @param {event} event The event that triggered the callback (should be form submit)
 * @returns {void} Does not return anything
 */
const handleFormSubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const url = form.action;

  if (!form.checkValidity()) {
    return;
  }
  form.classList.add('was-validated');

  try {
    let formData = new FormData(form);
    let responseData = await postFormDataAsJson({ url, formData });
    if (responseData.ok) {
      return window.location.replace('https://10.0.0.154:2000/');
    }
  } catch (e) {
    // if (e.message) {
    //   console.log(JSON.parse(e.message));
    //   alert(JSON.parse(e.message).error, 'danger');
    // } else {
    //   console.log('2', e);
    //   alert(e.message, 'danger');
    // }
    console.log('error in handleFormSubmit', e);
    form.classList.remove('was-validated');
  }
  return;
};

validateForm();
if (checkExpiredToken()) fetchToken();

// ***************************************
// ********* Forms Functionality *********
// ***************************************

// grabbing the form and attaching an event listener for when the form submits
const registerPageForm = document.querySelector('#registerPageForm'),
  loginPageForm = document.querySelector('#loginPageForm'),
  logoutForm = document.querySelector('#logoutForm');

if (registerPageForm)
  registerPageForm.addEventListener('submit', handleFormSubmit);
if (loginPageForm) loginPageForm.addEventListener('submit', handleFormSubmit);
if (logoutForm) logoutForm.addEventListener('submit', handleFormSubmit);

// This is to make the styles clean in mobile
// First we get the viewport height and we multiply it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);
