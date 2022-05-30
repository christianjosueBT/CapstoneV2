let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let scanBtn = document.querySelector('#scan');
let interactive = document.querySelector('#interactive');
let container = document.querySelector('#container');
let placeholder = document.querySelector('.viewport--placeholder');
let wrapper = document.querySelector('.wrapper');
const sensorId = document.getElementById('sensorId').value;

// custom leaflet map icon and popup
const userIcon = new L.icon({
  iconUrl: '../imgs/user.png',
  iconSize: [32, 32],
});
const storeIcon = new L.icon({
  iconUrl: '../imgs/stores.png',
  iconSize: [32, 32],
});
const popupOptions = {
  maxWidth: '400',
  className: 'popupCustom',
};
let routing;

// QUAGGA SECTION
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

// adds event listeners to the checkout button
scanBtn.addEventListener('touchstart', () => {
  scanBtn.classList.add('button--hover');
});
scanBtn.addEventListener('touchend', () => {
  scanBtn.classList.remove('button--hover');
  // scanBtn.classList.add('display--none');
  // placeholder.classList.add('display--none');
  interactive.classList.remove('display--none');
  // container.classList.remove('display--none');
  container.classList.add('animate--up');
});
scanBtn.addEventListener('mouseup', () => {
  // scanBtn.classList.add('display--none');
  // placeholder.classList.add('display--none');
  interactive.classList.remove('display--none');
  // container.classList.remove('display--none');
});

/**
 * When a barcode has been located, we draw boxes around located barcodes.
 * Different boxes signify different things
 * @param {Quagga scan result object} result Information about the decoded and located barcodes
 * @returns {void} Returns nothing
 */
Quagga.onProcessed(result => {
  const drawingCtx = Quagga.canvas.ctx.overlay;
  // drawingCanvas = Quagga.canvas.dom.overlay;

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
 * Adds multiple event listeners to an element
 * @param {DOM node} element The element to add event listeners to
 * @param {array} events Events array containing the events to listen for
 * @param {function} handler Event handler function
 * @returns {void} Returns nothing
 */
function addMultipleEventListener(element, events, handler) {
  events.forEach(e => element.addEventListener(e, handler));
}

/**
 * Verifies the customer has a valid cart to checkout with
 * @returns
 */
const loadAndCheckWeight = async () => {
  // check if the sensor weight and the calculated weight match within 10% (of calculated weight)
  // getting the weights from the cart and the sensor
  const cartWeight = document.querySelector('#totalWeight').value,
    cart = document.querySelector('#rightCart');

  if (cart.childElementCount <= 1) {
    alert('Your cart is empty!', 'danger');
    return;
  }

  let sensorWeight = await fetch(
    `https://chris-desktop:2000/sensor/${sensorId}/weight`
  );
  sensorWeight = await sensorWeight.json();
  sensorWeight = -sensorWeight.weight;

  console.log(
    `weight from the sensor ${sensorWeight}\n weight computed from database ${cartWeight}`
  );

  alert('You have successfully checked out!', 'success');
  // if (
  //   (sensorWeight > cartWeight * 0.9 && sensorWeight < cartWeight * 1.1) ||
  //   (sensorWeight > cartWeight - 0.01 && sensorWeight < cartWeight + 0.01)
  // ) {
  //   alert('You have successfully checked out!', 'success');
  // } else {
  //   alert('Weights do not match, try again', 'danger');
  // }
};

// deletes an item from cart
const deleteFromCart = (product, formObject, node) => {
  return function deleteFromCartCurried() {
    let totalWeight = document.querySelector('#totalWeight'),
      subtotal = document.querySelector('#subtotal');

    if (formObject.value && formObject.value > 0) {
      console.log(formObject.value);

      totalWeight.value =
        Number(totalWeight.value) -
        product.weight.$numberDecimal * formObject.value;
      subtotal.innerHTML = `${
        Number(subtotal.innerHTML) -
        product.price.$numberDecimal * formObject.value
      }`;
    }

    node.remove();
    return;
  };
};

// adds an item to the cart
const addToCart = (product, formObject) => {
  return function addToCartCurried() {
    // creating all the elements we will need
    let rightMenu = document.querySelector('#rightCart'),
      subtotal = document.querySelector('#subtotal'),
      totalWeight = document.querySelector('#totalWeight'),
      li = document.createElement('li'),
      a = document.createElement('a'),
      img = document.createElement('img'),
      p = document.createElement('h4'),
      row = document.createElement('div'),
      form = document.createElement('input'),
      btn = document.createElement('button');

    // giving them their necessary classes and attributes
    a.className = 'sidebar-right__item';
    img.className = 'rounded';
    row.className = 'row';
    form.className = 'form-control rounded';
    form.setAttribute('type', 'number');
    form.setAttribute('min', 1);
    btn.className = 'btn btn-danger rounded';

    // giving items their values
    totalWeight.value =
      Number(totalWeight.value) +
      product.weight.$numberDecimal * formObject.value;
    subtotal.innerHTML = `${
      Number(subtotal.innerHTML) +
      product.price.$numberDecimal * formObject.value
    }`;
    img.setAttribute('src', product.images[0]);
    form.value = formObject.value;
    form.dataset.previous = form.value;
    p.innerHTML = `$${product.price.$numberDecimal}`;
    btn.innerHTML = 'delete';

    // appending
    row.appendChild(form);
    row.appendChild(btn);
    a.appendChild(img);
    a.appendChild(p);
    a.appendChild(row);
    li.appendChild(a);
    rightMenu.appendChild(li);

    // click event listener for button. Deletes the node
    btn.addEventListener('click', deleteFromCart(product, form, li));
    form.addEventListener('input', updateCart(product));
  };
};

const updateCart = product => {
  return function updateCartCurried() {
    let previous = this.dataset.previous,
      current = this.value,
      subtotal = document.querySelector('#subtotal'),
      totalWeight = document.querySelector('#totalWeight');

    // updating the previous value to current
    this.dataset.previous = this.value;

    // updating cart weight and subtotal values
    totalWeight.value =
      Number(totalWeight.value) +
      product.weight.$numberDecimal * (current - previous);
    subtotal.innerHTML = `${
      Number(subtotal.innerHTML) +
      product.price.$numberDecimal * (current - previous)
    }`;
  };
};

const loadProduct = async result => {
  const code = result.codeResult.code;
  if (App.lastResult !== code) {
    let res, product;
    try {
      res = await fetch(
        `https://chris-desktop:2000/api/v1/products/id/${code}`
      ).then(res => res.text());
    } catch (e) {
      console.error('Error inside Quagga.onDetected');
    }
    res = JSON.parse(res);
    if (Object.keys(res).length !== 0) {
      product = res.product;

      // creating all the elements we will need
      App.lastResult = code;
      let modal = document.createElement('div'),
        modalDialog = document.createElement('div'),
        modalContent = document.createElement('div'),
        modalHeader = document.createElement('div'),
        modalTitle = document.createElement('h5'),
        closeBtn = document.createElement('button'),
        modalBody = document.createElement('div'),
        bodyForm = document.createElement('div'),
        formInput = document.createElement('input'),
        formLabel = document.createElement('label'),
        modalImg = document.createElement('img'),
        numBtn = document.createElement('button'),
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
      bodyForm.className = 'form-outline';
      formInput.className = 'form-control';
      formInput.id = 'formNumber';
      formInput.setAttribute('type', 'number');
      formLabel.className = 'form-label';
      formLabel.setAttribute('for', 'forNumber');
      modalImg.setAttribute('src', product.images[0]);
      addBtn.className = 'btn btn-primary';
      addBtn.setAttribute('data-bs-dismiss', 'modal');
      modalFooter.className = 'modal-footer';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.setAttribute('data-bs-dismiss', 'modal');
      numBtn.className = 'btn btn-primary';

      // setting inner content
      modalTitle.innerHTML = product.name;
      cancelBtn.innerHTML = 'cancel';
      addBtn.innerHTML = 'add';
      numBtn.innerHTML = 'quantity';
      formLabel.innerHTML = 'quantity';

      // addBtn.addEventListener('touchstart', () => {
      //   addBtn.classList.add('button--hover');
      // });
      // addBtn.addEventListener('touchend', () => {
      //   addBtn.classList.remove('button--hover');
      //   // scanBtn.classList.add('display--none');
      //   // placeholder.classList.add('display--none');
      //   interactive.classList.remove('display--none');
      //   // container.classList.remove('display--none');
      //   container.classList.add('animate--up');
      // });
      addBtn.addEventListener('click', () => {
        interactive.classList.remove('display--none');
      });

      // appending shit
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeBtn);
      bodyForm.appendChild(formInput);
      bodyForm.appendChild(formLabel);
      modalBody.appendChild(modalImg);
      modalBody.appendChild(bodyForm);
      // modalBody.appendChild(numBtn);
      modalFooter.appendChild(cancelBtn);
      modalFooter.appendChild(addBtn);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modalContent.appendChild(modalFooter);
      modalDialog.appendChild(modalContent);
      modal.appendChild(modalDialog);
      document.body.insertBefore(modal, document.body.firstChild);

      // function that makes addBtn add items to the cart
      addBtn.addEventListener('click', addToCart(product, formInput));

      // creating a bootstrap instance of a modal to trigger its behaviour
      let myModal = new bootstrap.Modal(document.getElementById('modal'));
      myModal.show();
    }
  }
};

App.init();

Quagga.onDetected(async result => loadProduct(result));

// adds event listeners to the buttons
document.querySelector('.btn-left').addEventListener('click', function () {
  this.classList.toggle('click');
  document.querySelector('.sidebar-left').classList.toggle('show');
});
document.querySelector('.btn-right').addEventListener('click', function () {
  this.classList.toggle('click');
  document.querySelector('.sidebar-right').classList.toggle('show');
});
// when the user presses the checkout button, we verify that the weight in the cart matches the calculated weight
document
  .querySelector('#checkout')
  .addEventListener('click', loadAndCheckWeight);
