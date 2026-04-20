const CART_STORAGE_KEY = "525hp-cart";

const checkoutForm = document.getElementById("checkout-form");
const checkoutOrderList = document.getElementById("checkout-order-list");
const checkoutEmptyState = document.getElementById("checkout-empty-page");
const checkoutItemsCount = document.getElementById("checkout-items-count");
const checkoutTotal = document.getElementById("checkout-total");
const cartToast = document.getElementById("cart-toast");

let toastTimeoutId;
let cart = loadCart();

function loadCart() {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function formatPrice(price) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(price);
}

function getTotalItems() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getSubtotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function showToast(message) {
    window.clearTimeout(toastTimeoutId);
    cartToast.textContent = message;
    cartToast.classList.add("is-visible");

    toastTimeoutId = window.setTimeout(() => {
        cartToast.classList.remove("is-visible");
    }, 2600);
}

function renderCheckout() {
    checkoutOrderList.innerHTML = "";

    const hasItems = cart.length > 0;
    checkoutEmptyState.hidden = hasItems;
    checkoutForm.querySelector('button[type="submit"]').disabled = !hasItems;

    cart.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.className = "checkout-order-item";
        listItem.innerHTML = `
            <img class="checkout-order-thumb" src="${item.image}" alt="${item.name}">
            <div class="checkout-order-copy">
                <p class="checkout-order-name">${item.name}</p>
                <p class="checkout-order-meta">Cantidad: ${item.quantity}</p>
            </div>
            <strong class="checkout-order-price">${formatPrice(item.price * item.quantity)}</strong>
        `;
        checkoutOrderList.appendChild(listItem);
    });

    checkoutItemsCount.textContent = getTotalItems();
    checkoutTotal.textContent = hasItems ? formatPrice(getSubtotal()) : "$0";
}

checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!cart.length) {
        showToast("Tu Garage esta vacio. Agrega productos antes de continuar.");
        return;
    }

    if (!checkoutForm.reportValidity()) {
        return;
    }

    const orderNumber = `525-${Date.now().toString().slice(-6)}`;
    cart = [];
    saveCart();
    renderCheckout();
    checkoutForm.reset();
    showToast(`Pedido ${orderNumber} confirmado. Te escribiremos para coordinar la entrega.`);
});

renderCheckout();
