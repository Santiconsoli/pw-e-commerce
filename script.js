const CART_STORAGE_KEY = "525hp-cart";

const cartToggleButton = document.getElementById("cart-toggle");
const cartCloseButton = document.getElementById("cart-close");
const cartOverlay = document.getElementById("cart-overlay");
const cartPanel = document.getElementById("cart-panel");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartSubtotal = document.getElementById("cart-subtotal");
const continueShoppingButton = document.getElementById("cart-continue");
const clearCartButton = document.getElementById("cart-clear");
const checkoutButton = document.getElementById("cart-checkout");
const addToCartButtons = document.querySelectorAll(".btn-add");

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

function updateCartButton() {
    const totalItems = getTotalItems();
    cartCount.textContent = totalItems;
    cartToggleButton.setAttribute(
        "aria-label",
        `Abrir carrito de compras con ${totalItems} producto${totalItems === 1 ? "" : "s"}`
    );
}

function renderCart() {
    const hasItems = cart.length > 0;

    cartItems.innerHTML = "";
    cartEmpty.hidden = hasItems;
    clearCartButton.disabled = !hasItems;
    checkoutButton.disabled = !hasItems;

    if (!hasItems) {
        cartSubtotal.textContent = "$0";
        updateCartButton();
        return;
    }

    cart.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.className = "cart-item";
        listItem.innerHTML = `
            <div class="cart-item-top">
                <div class="cart-item-main">
                    <img class="cart-item-thumb" src="${item.image}" alt="${item.name}">
                    <div>
                        <p class="cart-item-name">${item.name}</p>
                        <p class="cart-item-price">${formatPrice(item.price)}</p>
                    </div>
                </div>
                <p class="cart-item-price">${formatPrice(item.price * item.quantity)}</p>
            </div>
            <div class="cart-item-controls">
                <div class="cart-qty-controls">
                    <button type="button" class="cart-qty-btn" data-action="decrease" data-product-id="${item.id}">-</button>
                    <span class="cart-qty-value">${item.quantity}</span>
                    <button type="button" class="cart-qty-btn" data-action="increase" data-product-id="${item.id}">+</button>
                </div>
                <button type="button" class="cart-remove-btn" data-action="remove" data-product-id="${item.id}">Quitar</button>
            </div>
        `;

        cartItems.appendChild(listItem);
    });

    cartSubtotal.textContent = formatPrice(getSubtotal());
    updateCartButton();
}

function openCart() {
    document.body.classList.add("cart-open");
    cartPanel.classList.add("is-open");
    cartOverlay.hidden = false;
    cartOverlay.classList.add("is-visible");
    cartPanel.setAttribute("aria-hidden", "false");
    cartToggleButton.setAttribute("aria-expanded", "true");
}

function closeCart() {
    document.body.classList.remove("cart-open");
    cartPanel.classList.remove("is-open");
    cartOverlay.classList.remove("is-visible");
    cartOverlay.hidden = true;
    cartPanel.setAttribute("aria-hidden", "true");
    cartToggleButton.setAttribute("aria-expanded", "false");
}

function addToCart(product) {
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    renderCart();
    openCart();
}

function updateQuantity(productId, nextQuantity) {
    cart = cart
        .map((item) => {
            if (item.id !== productId) {
                return item;
            }

            return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0);

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();
}

addToCartButtons.forEach((button) => {
    button.addEventListener("click", () => {
        addToCart({
            id: button.dataset.productId,
            name: button.dataset.productName,
            price: Number(button.dataset.productPrice),
            image: button.dataset.productImage,
        });
    });
});

cartToggleButton.addEventListener("click", openCart);
cartCloseButton.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
continueShoppingButton.addEventListener("click", closeCart);

clearCartButton.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
});

checkoutButton.addEventListener("click", () => {
    alert("El checkout todavia no esta implementado, pero tu carrito ya funciona.");
});

cartItems.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const { action, productId } = target.dataset;

    if (!action || !productId) {
        return;
    }

    const currentItem = cart.find((item) => item.id === productId);

    if (!currentItem) {
        return;
    }

    if (action === "increase") {
        updateQuantity(productId, currentItem.quantity + 1);
    }

    if (action === "decrease") {
        updateQuantity(productId, currentItem.quantity - 1);
    }

    if (action === "remove") {
        removeFromCart(productId);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cartPanel.classList.contains("is-open")) {
        closeCart();
    }
});

renderCart();
