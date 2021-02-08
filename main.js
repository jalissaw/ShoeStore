
document.addEventListener("DOMContentLoaded", () => {
    async function fetchData(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data
    }

    const products = new Products();

    products.setupAPP()
    fetchData(`json/items.json`)
        .then(data => {
            products.displayProducts(data.items)
            Storage.saveProducts(data.items);
            products.voiceCommand(data.items)
        }).then(() => {
            products.getButtons()
            products.cartLogic()
        }).catch(err => {
            console.log(err)
        });

});


const cartItemCount = document.querySelector('[data-item-counter]');
const cartMenuItemsContainer = document.querySelector('.cart-menu-items');
const menuTotal = document.querySelector('[data-menu-total]');
const cartMenu = document.querySelector('.cart-menu-container');
const showCartItem = document.querySelector('.products-container');
const closeButton = document.querySelector('.fa-times');
const shoppingCartIcon = document.querySelector('.fa-shopping-cart');
const promoBtn = document.querySelector('.promo-btn');
const promoContainer = document.querySelector('.promo-container');


let cart = [];
let buttonsDOM = [];


class Products {
    displayProducts(products) {
        let result = ''
        products.forEach(product => {
            result +=
                `<div class='product'>
                    <img class="img" src=${product.image}>
                    <h2 class="item-title">${product.title}</h2>
                    <h3 class="price">${product.price}</h3>
                    <button class="btn cart-btn" data-id=${product.id}><i class="fas fa-shopping-cart"></i>Add To Cart</button>   
                </div>`
        });
        showCartItem.innerHTML = result;
    }

    getButtons() {
        const buttons = [...document.querySelectorAll('.cart-btn')]
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === Number(id));

            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener('click', (e) => {
                let id = Number(button.dataset.id);
                let cartItem = { ...Storage.getProduct(id), amount: 1 };
                console.log(cartItem)
                cart = [...cart, cartItem];
                e.target.innerText = "In Cart";
                e.target.disabled = true;
                Storage.saveCart(cart);
                this.addCartItem(cartItem);
                this.setCartValues(cart);
                this.openCart();
            });
        })
    }

    addCartItem(cartItem) {
        const div = document.createElement('div')
        div.classList.add('menu-product');
        div.innerHTML +=
            ` 
            <img class="menu-img" src=${cartItem.image}>
                <div class="menu-titles-container">
                    <h2 class="menu-item-title">${cartItem.title}</h2>
                    <h3 class="menu-price">${cartItem.price}</h3>
                    <button class="btn remove-btn" data-id=${cartItem.id}>Remove</button>
                </div>
                <div class='change-price-container'>
                    <i class="fas fa-chevron-up" data-id=${cartItem.id}></i>
                    <p class="item-amount">${cartItem.amount}</p>
                    <i class="fas fa-chevron-down" data-id=${cartItem.id}></i>
                </div>
            `
        cartMenuItemsContainer.appendChild(div);
        this.openCart()
    }

    setCartValues(cart) {
        let cartTotal = 0;
        let menuPriceTotal = 0;

        cart.map(item => {
            menuPriceTotal += item.price * item.amount;
            cartTotal += item.amount;
        })

        cartItemCount.innerText = cartTotal;
        menuTotal.innerText = parseFloat(menuPriceTotal.toFixed(2))
    }

    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
    }

    populateCart() {
        cart.forEach(item => this.addCartItem(item));
    }

    openCart() {
        cartMenu.classList.add('open');
    }

    closeCart() {

        cartMenu.classList.remove('open');
        closeButton.addEventListener('click', () => {
            cartMenu.classList.remove('open');
        });
    }

    cartLogic() {

        cartMenuItemsContainer.scrollTop = cartMenuItemsContainer.scrollHeight
        shoppingCartIcon.addEventListener('click', () => {
            cartMenu.classList.add('open');
        });
        this.closeCart()
        cartMenuItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                let removeItem = e.target;
                let id = Number(removeItem.dataset.id);
                cartMenuItemsContainer.removeChild(removeItem.parentElement.parentElement)
                this.removeCartItem(id)
            }
            else if (e.target.classList.contains('fa-chevron-up')) {
                let addAmount = e.target
                let id = Number(addAmount.dataset.id)
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount
            }
            else if (e.target.classList.contains('fa-chevron-down')) {
                let lowerAmount = e.target
                let id = Number(lowerAmount.dataset.id)
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;

                if (tempItem.amount > 0) {
                    Storage.saveCart(cart)
                    this.setCartValues(cart);
                } else {
                    cartMenuItemsContainer.removeChild(lowerAmount.parentElement.parentElement)
                    this.removeCartItem(id)
                }

                lowerAmount.previousElementSibling.innerText = tempItem.amount
            }
        })
    }

    removeCartItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    }

    getSingleButton(id) {
        return buttonsDOM.find(button => Number(button.dataset.id) === id);
    }

    voiceCommand(data) {
        const products = new Products();

        let alanBtnInstance = alanBtn({
            top: '15px',
            left: '15px',
            key: 'd9a862fcf1b4bafe16223c5c1bb1f8b32e956eca572e1d8b807a3e2338fdd0dc/stage',
            onCommand: function (commandData) {
                if (commandData.command === "opencart") {
                    products.openCart();
                }

                else if (commandData.command === "closecart") {
                    products.closeCart();
                }

                else if (commandData.command === "addItem") {
                    // get cart Items to compare to commandData.name
                    const cartItem = data
                    cartItem.forEach(item => {
                        return item.amount = 1
                    });

                    const item = cartItem.map(item => item)
                        .find(item => item.title.toLowerCase() === commandData.name.toLowerCase());
                    cart = [...cart, item]

                    function hasDuplicates(arr) {
                        return new Set(arr).size !== arr.length;
                    }

                    if (hasDuplicates(cart)) {
                        alanBtnInstance.playText(`${item.title} is already in cart`);
                        return
                    } else {
                        const buttons = [...document.querySelectorAll('.cart-btn')]
                        buttonsDOM = buttons;
                        buttons.forEach(button => {
                            let id = button.dataset.id;
                            let inCart = cart.find(item => item.id === Number(id));

                            if (inCart) {
                                button.innerText = "In Cart";
                                button.disabled = true;
                            }
                        });
                        products.addCartItem(item);
                        products.setCartValues(cart);
                    }
                }
            },
            rootEl: document.getElementById("alan-btn"),
        });
    }
}

class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));
        return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem("cart")
            ? JSON.parse(localStorage.getItem("cart"))
            : [];
    }
}
