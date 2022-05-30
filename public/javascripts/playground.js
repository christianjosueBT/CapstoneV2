let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let scanBtn = document.querySelector('#scan');
let interactive = document.querySelector('#interactive');
let container = document.querySelector('#container');
let findStores = document.querySelector('.findStores');
let placeholder = document.querySelector('.viewport--placeholder');
let wrapper = document.querySelector('.wrapper');
let process = {
  env: {
    NUTRITIONIX_APP_ID: '53ad2dde',
    NUTRITIONIX_APP_KEY: '7d90181d97293068e978d5885332c688',
  },
}; // this should really change. Probably should use webpack

let myMap, routing, userIcon, storeIcon, myLocation;

/**
 * Defining an instance of the Quagga object
 */
const App = {
  init: function () {
    Quagga.init(this.state, err => {
      if (err) {
        console.log(err);
        return;
      }
      App.attachListeners();
      App.checkCapabilities();
      Quagga.start();
    });
  },

  checkCapabilities: function () {
    const track = Quagga.CameraAccess.getActiveTrack();
    let capabilities = {};
    if (typeof track.getCapabilities === 'function') {
      capabilities = track.getCapabilities();
    }
    this.applySettingsVisibility('zoom', capabilities.zoom);
    this.applySettingsVisibility('torch', capabilities.torch);
  },

  applySettingsVisibility: function (setting, capability) {
    // depending on type of capability
    if (typeof capability === 'boolean') {
      const node = document.querySelector(
        `select[name="settings_'${setting}'"]`
      );
      if (node) {
        node.parentNode.style.display = capability ? 'block' : 'none';
      }
      return;
    }
    if (
      window.MediaSettingsRange &&
      capability instanceof window.MediaSettingsRange
    ) {
      const node = document.querySelector(
        `select[name="settings_'${setting}'"]`
      );
      if (node) {
        this.updateOptionsForMediaRange(node, capability);
        node.parentNode.style.display = 'block';
      }
      return;
    }
  },
  initCameraSelection: function () {
    let streamLabel = Quagga.CameraAccess.getActiveStreamLabel();

    return Quagga.CameraAccess.enumerateVideoDevices().then(devices => {
      const pruneText = text => {
        return text.length > 30 ? text.substr(0, 30) : text;
      };
    });
  },
  attachListeners: function () {
    const self = this;
    const controls = document.querySelector('.controls');
    const readerConfig = document.querySelector('.reader-config-group');

    self.initCameraSelection();
  },

  state: {
    inputStream: {
      type: 'LiveStream',
      constraints: {
        width: windowWidth,
        height: windowHeight + 20,
        aspectRatio: { min: 1, max: 100 },
        facingMode: 'environment', // or user
      },
    },
    locator: {
      patchSize: 'medium',
      halfSample: true,
    },
    numOfWorkers: 2,
    frequency: 5,
    decoder: {
      readers: [
        {
          format: 'code_128_reader',
          config: {},
        },
        {
          format: 'upc_reader',
          config: {},
        },
      ],
    },
    locate: true,
  },
  lastResult: null,
};

// Cart class containing all functions and logic related to our cart
class Cart {
  /**
   * Adds an item to the cart and updates the total price
   * @param {object} product The product object fetched from our database. Soon to be updated for a product from nutritionix
   * @param {DOM node} formObject The created product form displayed in the cart. Contains the product quantity in the cart
   * @param {DOM node} node The li node that contains all information related to the product in the cart
   * @returns {void} Returns nothing
   */
  static addToCart = (product, formObj) => {
    return function addToCartCurried() {
      // creating all the elements we will need
      let cart = window.localStorage.cart,
        rightMenu = document.querySelector('#rightCart'),
        subtotal = document.querySelector('#subtotal'),
        itemNum = document.createElement('input'),
        li = document.createElement('li'),
        liContainer = document.createElement('div'),
        a = document.createElement('a'),
        name = document.createElement('h5'),
        img = document.createElement('img'),
        p = document.createElement('h4'),
        row = document.createElement('div'),
        form = document.createElement('input'),
        btn = document.createElement('button');

      product.quantity = parseInt(formObj.value);
      cart === undefined ? (cart = []) : (cart = JSON.parse(cart));

      // giving them their necessary classes and attributes
      liContainer.className = 'sidebar-right__item';
      name.className = 'anchor-styles';
      img.className = 'rounded';
      row.className = 'row';
      form.className = 'form-control rounded';
      form.setAttribute('type', 'number');
      form.setAttribute('min', 1);
      btn.className = 'btn btn-danger rounded';
      itemNum.setAttribute('type', 'number');
      itemNum.className = 'item-number';
      itemNum.hidden = true;
      itemNum.value = parseInt(cart.length);

      // giving items their values
      subtotal.textContent = `${
        Number(subtotal.innerHTML) + product.price * product.quantity
      }`;
      a.href = `/products/${product.upc}`;
      name.innerHTML = `${product.brand}<br>${product.name}`;
      img.setAttribute('src', product.photo);
      form.value = product.quantity;

      form.dataset.previous = form.value;
      p.textContent = `$${product.price}`;
      btn.textContent = 'delete';

      // appending
      row.appendChild(form);
      row.appendChild(btn);
      a.appendChild(name);
      liContainer.appendChild(a);
      liContainer.appendChild(img);
      liContainer.appendChild(p);
      liContainer.appendChild(row);
      li.appendChild(liContainer);
      li.appendChild(itemNum);
      rightMenu.firstElementChild.after(li);

      cart.push(product);
      window.localStorage.cart = JSON.stringify(cart);

      // click event listener for button. Deletes the node
      btn.addEventListener('click', Cart.deleteFromCart(product, form, li));
      form.oninput = Cart.updateCart(product);

      return;
    };
  };

  static addToCartFromStorage = (product, pos) => {
    let rightMenu = document.querySelector('#rightCart'),
      subtotal = document.querySelector('#subtotal'),
      itemNum = document.createElement('input'),
      li = document.createElement('li'),
      liContainer = document.createElement('div'),
      name = document.createElement('h6'),
      a = document.createElement('a'),
      img = document.createElement('img'),
      p = document.createElement('h4'),
      row = document.createElement('div'),
      form = document.createElement('input'),
      btn = document.createElement('button');

    // giving them their necessary classes and attributes
    liContainer.className = 'sidebar-right__item';
    name.className = 'anchor-styles';
    img.className = 'rounded';
    row.className = 'row';
    form.className = 'form-control rounded';
    form.setAttribute('type', 'number');
    form.setAttribute('min', 1);
    btn.className = 'btn btn-danger rounded';
    itemNum.setAttribute('type', 'number');
    itemNum.className = 'item-number';
    itemNum.hidden = true;
    itemNum.value = pos;

    // giving items their values
    subtotal.textContent = `${
      Number(subtotal.innerHTML) + product.price * product.quantity
    }`;
    a.href = `/products/${product.upc}`;
    name.innerHTML = `${product.brand}<br>${product.name}`;
    img.setAttribute('src', product.photo);
    form.value = product.quantity;

    form.dataset.previous = form.value;
    p.textContent = `$${product.price}`;
    btn.textContent = 'delete';

    // appending
    row.appendChild(form);
    row.appendChild(btn);
    a.appendChild(name);
    liContainer.appendChild(a);
    liContainer.appendChild(img);
    liContainer.appendChild(p);
    liContainer.appendChild(row);
    li.appendChild(liContainer);
    li.appendChild(itemNum);
    rightMenu.firstElementChild.after(li);

    // click event listener for button. Deletes the node
    btn.addEventListener('click', Cart.deleteFromCart(product, form, li));
    form.oninput = Cart.updateCart(product);

    return;
  };

  /**
   * Deletes an item from cart and updates the total price of the cart.
   * @param {object} product The product object fetched from our database. Soon to be updated for a product from nutritionix
   * @param {DOM node} formObject The created product form displayed in the cart. Contains the product quantity in the cart
   * @param {DOM node} node The li node that contains all information related to the product in the cart
   * @returns {void} Returns nothing
   */
  static deleteFromCart = (product, formObject, node) => {
    return function deleteFromCartCurried() {
      let subtotal = document.querySelector('#subtotal');
      let previous = node.previousElementSibling;
      let cart = JSON.parse(window.localStorage.cart);

      // updating the cart's subtotal
      if (formObject.value && formObject.value > 0) {
        subtotal.textContent = `${
          Number(subtotal.innerHTML) - product.price * formObject.value
        }`;
      }

      // deleting the localstorage representation of the node to be deleted
      cart.splice(node.querySelector('.item-number').value, 1);
      // updating the localstorage representation of the node
      window.localStorage.cart = JSON.stringify(cart);

      // programmatically decreasing the item number value of all previous cart siblings
      while (previous.previousElementSibling !== null) {
        previous.querySelector('.item-number').stepDown();
        previous = previous.previousElementSibling;
      }

      node.remove();
      return;
    };
  };

  /**
   * Update the subtotal cart price every time input is changed.
   * @param {object} product The product object fetched from our database. Soon to be updated for a product from nutritionix
   * @returns {void} Returns nothing
   */
  static updateCart = product => {
    return function updateCartCurried() {
      // making sure input is always positive
      this.value = Math.abs(this.value);

      let previous = this.dataset.previous,
        current = this.value,
        cart = JSON.parse(window.localStorage.cart),
        li = this.parentElement.parentElement.parentElement,
        subtotal = document.querySelector('#subtotal');

      // updating the previous value to current
      this.dataset.previous = current;
      let itemNum = li.querySelector('.item-number').value;
      cart[itemNum].quantity = current;
      window.localStorage.cart = JSON.stringify(cart);

      // updating cart subtotal
      subtotal.textContent = `${
        Number(subtotal.innerHTML) + product.price * (current - previous)
      }`;
    };
  };

  /**
   * Verifies the customer has a valid cart to checkout with.
   * Adds either a success or error alert to the message
   * @returns {void} Returns nothing
   */
  static checkout = async () => {
    const cart = document.querySelector('#rightCart');

    if (cart.childElementCount <= 1) {
      alert('Your cart is empty!', 'danger');
    } else alert('You have successfully checked out!', 'success');

    return;
  };

  static checkIfCart = () => {
    if (window.localStorage.cart === undefined) return;

    let cart = JSON.parse(window.localStorage.cart);
    Cart.loadCart(cart);
    return;
  };

  static loadCart = cart => {
    for (let i = cart.length - 1; i >= 0; i--) {
      Cart.addToCartFromStorage(cart[i], i);
    }
    return;
  };
}

// Modal class containing all logic and functions related to modals
class Modal {
  /**
   * Loads a product from the database into a modal. Soon to be updated for a product from nutritionix
   * @param {object} result The product object fetched from our database. Soon to be updated for a product from nutritionix
   * @param {boolean} nutritionix Boolean value indicating whether to fetch from nutritionix
   * @returns {void} Returns nothing
   */
  static loadProduct = async (result, nutritionix) => {
    if (Modal.checkIfOpen()) return;

    // we execute this code if the last decoded barcode is not the same as the current
    const code = result.codeResult.code;
    if (App.lastResult !== code) {
      let res, url, options;
      try {
        // nutritionix variables
        if (nutritionix) {
          url = `https://trackapi.nutritionix.com/v2/search/item?upc=${code}`;
          options = {
            headers: {
              'Content-Type': 'application/json',
              'x-app-id': process.env.NUTRITIONIX_APP_ID,
              'x-app-key': process.env.NUTRITIONIX_APP_KEY,
              'x-remote-user-id': 0,
            },
          };
        }
        // our database variables
        else {
          url = `https://10.0.0.154:2000/api/v1/products/id/${code}`;
          options = {};
        }

        res = await fetch(url, options);
      } catch (e) {
        console.error('Error inside Quagga.onDetected', e);
      }

      await Modal.createModal(res, nutritionix, code);
    }
    return;
  };

  /**
   * Given a fetch result and a nutritionix boolean value, we create a modal with the
   * product information
   * @param {fetch object} res Returned fetch object
   * @param {boolean} nutritionix Boolean value indicating whether the res object is a nutritionix object
   */
  static createModal = async (res, nutritionix, code) => {
    if (Modal.checkIfOpen()) return;

    let product = {};
    if (nutritionix) {
      try {
        if (res.status === '404') throw new Error('Product not found');
        res = await res.json();
        res = res.foods[0];
        product = {
          name: res.food_name,
          brand: res.brand_name,
          photo:
            typeof res.photo.highres === 'string'
              ? res.photo.highres
              : res.photo.thumb,
          price: Math.floor(Math.random() * 10),
          upc: code,
        };
      } catch (e) {
        if ((e.message = 'Product not found'))
          return alert("Sorry, we could't find that product 🙅‍♂️", 'danger');
        return console.error('Error in createModal function', e);
      }
    } else {
      try {
        res = await res.text();
        res = JSON.parse(res);
        res = res.product;
        product = {
          name: res.name,
          photo: res.images[0],
          price: res.price,
        };
      } catch (e) {
        return console.error('Error in creataModal function', e);
      }
    }

    // creating all the elements we will need
    App.lastResult = code;
    let modal = document.createElement('div'),
      modalDialog = document.createElement('div'),
      modalContent = document.createElement('div'),
      modalHeader = document.createElement('div'),
      modalTitle = document.createElement('h5'),
      closeBtn = document.createElement('button'),
      modalBody = document.createElement('div'),
      bodyRow = document.createElement('div'),
      bodyForm = document.createElement('div'),
      formInput = document.createElement('input'),
      formLabel = document.createElement('label'),
      modalImg = document.createElement('img'),
      price = document.createElement('h5'),
      modalFooter = document.createElement('div'),
      cancelBtn = document.createElement('button'),
      addBtn = document.createElement('button');

    // giving the elements their necessary classes and attributes
    modal.className = 'modal fade';
    modal.id = 'modal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('ariaHidden', 'true');
    modalDialog.className = 'modal-dialog modal-dialog-centered';
    modalContent.className = 'modal-content';
    modalHeader.className = 'modal-header';
    modalTitle.className = 'modal-title';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'modal');
    modalBody.className = 'modal-body';
    bodyRow.className = 'column-center';
    bodyForm.className = 'form-outline';
    formInput.className = 'form-control';
    formInput.id = 'formNumber';
    formInput.setAttribute('type', 'number');
    formLabel.className = 'form-label';
    formLabel.setAttribute('for', 'forNumber');
    modalImg.setAttribute('src', product.photo);
    addBtn.className = 'btn btn-primary';
    addBtn.setAttribute('data-bs-dismiss', 'modal');
    modalFooter.className = 'modal-footer';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.setAttribute('data-bs-dismiss', 'modal');

    // setting inner content
    modalTitle.textContent = product.name;
    cancelBtn.textContent = 'cancel';
    price.textContent = `price: $${product.price}`;
    addBtn.textContent = 'add';
    formLabel.textContent = 'quantity';

    addBtn.addEventListener('click', () => {
      interactive.classList.remove('display--none');
    });

    // appending shit
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    bodyForm.appendChild(formInput);
    bodyForm.appendChild(formLabel);
    bodyRow.appendChild(price);
    bodyRow.appendChild(bodyForm);
    modalBody.appendChild(modalImg);
    modalBody.appendChild(bodyRow);
    modalFooter.appendChild(cancelBtn);
    modalFooter.appendChild(addBtn);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);
    document.body.insertBefore(modal, document.body.firstChild);

    // function that makes addBtn add items to cart
    addBtn.addEventListener('click', Cart.addToCart(product, formInput));

    // creating a bootstrap instance of a modal to trigger its behaviour
    let myModal = new bootstrap.Modal(document.getElementById('modal'));
    modal.addEventListener('hidden.bs.modal', () => {
      myModal.dispose();
      Modal.close();
    });
    myModal.show();
    Modal.show();
  };

  /**
   * Returns a boolean indicating whether the modal is open.
   * @returns {boolean} true if a modal is open
   */
  static checkIfOpen() {
    return !!document.getElementById('modalOpen');
  }

  /**
   * Appends an element with id 'modalOpen' to the document.
   * This signifies that there is currently an open modal.
   * @returns {void} Returns nothing
   */
  static show() {
    let modalOpen = document.createElement('div');
    modalOpen.id = 'modalOpen';
    document.body.appendChild(modalOpen);
    return;
  }

  /**
   * Removes an element with id 'modalOpen' from the document.
   * This signifies that there a modal has been closed
   * @returns {void} Returns nothing
   */
  static close() {
    document.querySelector('#modalOpen').remove();
  }
}

// we check if the navigator's user agent matches any of the listed devices inside this function.
// if it does, we can say that the user is on a mobile device
// returns a boolean value, true if on mobile and false otherwise
const detectMob = () => {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  console.log(navigator.userAgent);

  return toMatch.some(toMatchItem => {
    return navigator.userAgent.match(toMatchItem);
  });
  // if (window.innerWidth) console.log(window.innerWidth);
};

/**
 * Given a url string, we create a script tag and add it to the DOM.
 * We then return a promise that will be resolved when the script either
 * loads or gives an error.
 * @param {string} url The source of the script tag
 * @returns {Promise} A promise that will be resolved when the script tag
 * loads
 */
const loadScript = url => {
  return new Promise(function (resolve, reject) {
    let script = document.createElement('script');
    script.src = url;
    script.async = false;
    script.onload = function () {
      resolve(url);
    };
    script.onerror = function () {
      reject(url);
    };
    document.body.appendChild(script);
  });
};

// loads the Map class and scripts that the class is depending on
const loadScriptsAndMapClass = () => {
  let scripts = [];

  scripts.push(
    new Promise(function (resolve, reject) {
      let script = document.createElement('script');
      let url = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      script.src = url;
      script.integrity =
        'sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==';
      script.crossOrigin = '';
      script.async = false;
      script.onload = function () {
        resolve(url);
      };
      script.onerror = function () {
        reject(url);
      };
      document.body.appendChild(script);
    })
  );
  scripts.push('/javascripts/leaflet.markercluster-src.js');
  scripts.push('/javascripts/leaflet.routingmachine.js');

  for (let i = 1; i < scripts.length; i++) {
    scripts[i] = loadScript(scripts[i]);
  }

  Promise.all(scripts)
    .then(function () {
      class Map {
        constructor(latitude, longitude) {
          this.map = L.map('map').setView([latitude, longitude], 13);
          L.tileLayer(
            'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
            {
              attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
              maxZoom: 18,
              id: 'mapbox/navigation-night-v1',
              tileSize: 512,
              zoomOffset: -1,
              accessToken:
                'pk.eyJ1IjoiY2hyaXN0aWFuYmVybmFsIiwiYSI6ImNrbGNtejJxdzJ3eTQydnBlNnJuc3I2cXEifQ.V32yro03000Yc41qqC226g',
            }
          ).addTo(this.map);

          this.popupOptions = {
            maxWidth: '400',
            className: 'popupCustom',
          };

          const div = document.createElement('div');
          div.id = 'userLocation';
          div.dataset.latitude = latitude;
          div.dataset.longitude = longitude;
          document.body.appendChild(div);
          this.latitude = latitude;
          this.longitude = longitude;

          this.userMarker = L.marker([latitude, longitude], {
            icon: userIcon,
          })
            .addTo(this.map)
            .bindPopup(
              `<h3>You are here!</h3> <div id="userLocation" data-latitude="${latitude}" data-longitude="${longitude}"></div>`,
              this.popupOptions
            );

          this.markers = L.markerClusterGroup();

          routing = new L.Routing.control({
            router: L.Routing.mapbox(
              'pk.eyJ1IjoiY2hyaXN0aWFuYmVybmFsIiwiYSI6ImNrbGNtejJxdzJ3eTQydnBlNnJuc3I2cXEifQ.V32yro03000Yc41qqC226g'
            ),
            lineOptions: {
              styles: [{ color: '#ca8826', opacity: 0.85, weight: 9 }],
            },
          }).addTo(this.map);
        }

        static createMap = (latitude, longitude) => {
          let modal = document.createElement('div'),
            modalDialog = document.createElement('div'),
            modalContent = document.createElement('div'),
            modalHeader = document.createElement('div'),
            modalTitle = document.createElement('h5'),
            closeBtn = document.createElement('button'),
            modalBody = document.createElement('div');

          // giving the elements their necessary classes and attributes
          modal.className = 'modal fade';
          modal.id = 'mapModal';
          modal.setAttribute('tabindex', '-1');
          modal.setAttribute('ariaHidden', 'true');
          modalDialog.className = 'modal-dialog modal-fullscreen';
          modalContent.className = 'modal-content';
          modalHeader.className = 'modal-header bgrnd-dark text-center';
          modalTitle.className = 'modal-title';
          closeBtn.className = 'btn-close btn-close-white';
          closeBtn.setAttribute('data-bs-dismiss', 'modal');
          modalBody.className = 'modal-body';
          modalBody.id = 'map';

          // setting inner content
          modalTitle.innerHTML = 'Find Supporting Stores Nearby';

          // appending shit
          modalHeader.appendChild(modalTitle);
          modalHeader.appendChild(closeBtn);
          modalContent.appendChild(modalHeader);
          modalContent.appendChild(modalBody);
          modalDialog.appendChild(modalContent);
          modal.appendChild(modalDialog);
          document.body.insertBefore(modal, document.body.firstChild);

          // creating a bootstrap instance of a modal to trigger its behaviour
          let myModal = new bootstrap.Modal(
            document.getElementById('mapModal')
          );
          myMap = new Map(latitude, longitude);
          modal.addEventListener('hidden.bs.modal', () => {
            Modal.close();
            myModal.dispose();
          });
          myModal.show();
          Modal.show();
          return myMap;
        };

        static createMapFromLocation = async location => {
          myMap = Map.createMap(
            location.coords.latitude,
            location.coords.longitude
          );
          await myMap.addStores();

          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, '500');
          return;
        };

        static userGeolocation = () => {
          const error = e => {
            return console.error(
              'error getting your location from Geolocation API',
              e
            );
          };

          // check if Geolocation API is available
          if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
          } else {
            navigator.geolocation.getCurrentPosition(
              Map.createMapFromLocation,
              error
            );
          }
        };

        addStores = async () => {
          let geoCodingURI = `https://api.mapbox.com/geocoding/v5/mapbox.places/grocery.json?types=poi&routing=true&proximity=${this.longitude},${this.latitude}&access_token=pk.eyJ1IjoiY2hyaXN0aWFuYmVybmFsIiwiYSI6ImNrbGNtejJxdzJ3eTQydnBlNnJuc3I2cXEifQ.V32yro03000Yc41qqC226g`;
          let userLatLng = new L.latLng(this.latitude, this.longitude);
          try {
            let res = await fetch(geoCodingURI);
            let data = await res.json();
            for (const feature of data.features) {
              console.log(feature);
              let latLng = new L.latLng(feature.center[1], feature.center[0]);
              let marker = L.marker([feature.center[1], feature.center[0]], {
                icon: storeIcon,
              });
              let dist =
                Math.round(
                  (userLatLng.distanceTo(latLng) / 1000 + Number.EPSILON) * 100
                ) / 100;
              marker.bindPopup(
                `<h3>${feature.text}</h3>
                <p>${
                  feature.properties.address
                    ? feature.properties.address
                    : feature.place_name
                }</p>
                <p><i class="fa-solid fa-route"></i>  ${dist} km</p>
                <button type="button" class="btn btn-primary rounded-pill" onclick="handleDirections(this.parentElement)">Directions</button>
                <div data-latitude="${feature.center[1]}" data-longitude="${
                  feature.center[0]
                }"></div>`,
                this.popupOptions
              );
              this.markers.addLayer(marker);
            }
            this.map.addLayer(this.markers);
            // console.log(map);
          } catch (e) {
            console.error(e);
          }
        };
      }

      // custom leaflet map icon and popup
      userIcon = new L.icon({
        iconUrl: '../imgs/user.png',
        iconSize: [64, 64],
        className: 'opacity-75',
      });
      storeIcon = new L.icon({
        iconUrl: '../imgs/stores.png',
        iconSize: [64, 64],
        className: 'opacity-75',
      });

      // adding event listener on findStores nav element
      findStores.addEventListener('click', async function (evt) {
        Map.userGeolocation();
      });
      // findStores.addEventListener('touchend', displayMap);
    })
    .catch(function (script) {
      console.log(script + ' failed to load');
    });
};

const handleDirections = element => {
  const btn = element.parentElement.parentElement.querySelector(
      '.leaflet-popup-close-button'
    ),
    storeLat = element.lastChild.dataset.latitude,
    storeLong = element.lastChild.dataset.longitude;

  if (detectMob())
    return (window.location.href = `https://www.google.com/maps?saddr=${myMap.latitude},${myMap.longitude}&daddr=${storeLat},${storeLong}`);

  routing.setWaypoints([
    L.latLng(myMap.latitude, myMap.longitude),
    L.latLng(storeLat, storeLong),
  ]);

  // find a way to close the popup
  btn.click();
  return;
};

/**
 * When a barcode has been located, we draw boxes around located barcodes.
 * Different boxes signify different things
 * @param {Quagga scan result object} result Information about the decoded and located barcodes
 * @returns {void} Returns nothing
 */
Quagga.onProcessed(result => {
  const drawingCtx = Quagga.canvas.ctx.overlay,
    drawingCanvas = Quagga.canvas.dom.overlay;

  if (result) {
    // drawing green bounding boxes around the located barcodes
    if (result.boxes) {
      drawingCtx.clearRect(0, 0, windowWidth, windowHeight);
      result.boxes
        .filter(box => {
          return box !== result.box;
        })
        .forEach(box => {
          Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
            color: 'green',
            lineWidth: 2,
          });
        });
    }
    // drawing a blue bounding box around the decoded barcode
    if (result.box) {
      Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
        color: '#00F',
        lineWidth: 2,
      });
    }
    // drawing a red line across the blue bounding box of the decoded barcode
    if (result.codeResult && result.codeResult.code) {
      Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
        color: 'red',
        lineWidth: 3,
      });
    }
  }
});

/**
 * When a barcode has been decoded, we try to fetach a product with that code
 * and display it to the user
 * @param {Quagga scan result object} result Information about the decoded barcode
 * @returns {void} Returns nothing
 */
Quagga.onDetected(async result => Modal.loadProduct(result, true));

// adds event listener to the checkout button
scanBtn.addEventListener('touchstart', () => {
  scanBtn.classList.add('button--hover');
});
scanBtn.addEventListener('touchend', () => {
  scanBtn.classList.remove('button--hover');
  interactive.classList.remove('display--none');
  container.classList.add('animate--up');
  App.init();
});
scanBtn.addEventListener('mouseup', () => {
  interactive.classList.remove('display--none');
});

// adds event listeners to the top left, top right, and checkout buttons
document.querySelector('.btn-left').addEventListener('click', function () {
  this.classList.toggle('click');
  this.classList.toggle('animate--right');
  document.querySelector('.sidebar-left').classList.toggle('animate--right');
});
document.querySelector('.btn-right').addEventListener('click', function () {
  this.classList.toggle('click');
  this.classList.toggle('animate--left');
  document.querySelector('.sidebar-right').classList.toggle('animate--left');
});
document.querySelector('#checkout').addEventListener('click', Cart.checkout);

document.addEventListener('readystatechange', event => {
  if (document.readyState === 'complete') {
    Cart.checkIfCart();
    loadScriptsAndMapClass();
  }
});
