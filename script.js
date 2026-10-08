// ===== Products Data =====
const products = [
  {
    id: 1,
    name: "iPhone 16 Pro Max",
    category: "phones",
    categoryAr: "هواتف ذكية",
    price: 62999,
    oldPrice: 67999,
    image: "https://images.unsplash.com/photo-1695048133142-1a204bbd4bc0?w=600&h=600&fit=crop",
    badge: "جديد"
  },
  {
    id: 2,
    name: "MacBook Pro 16\" M3",
    category: "laptops",
    categoryAr: "لابتوبات",
    price: 89999,
    oldPrice: 94999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop",
    badge: "الأكثر مبيعاً"
  },
  {
    id: 3,
    name: "AirPods Pro 2",
    category: "audio",
    categoryAr: "صوتيات",
    price: 9999,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop",
    badge: null
  },
  {
    id: 4,
    name: "Apple Watch Ultra 2",
    category: "wearables",
    categoryAr: "ساعات ذكية",
    price: 32999,
    oldPrice: 35999,
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&h=600&fit=crop",
    badge: "عرض"
  },
  {
    id: 5,
    name: "Samsung Galaxy S25 Ultra",
    category: "phones",
    categoryAr: "هواتف ذكية",
    price: 54999,
    oldPrice: 58999,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop",
    badge: "جديد"
  },
  {
    id: 6,
    name: "Sony WH-1000XM5",
    category: "audio",
    categoryAr: "صوتيات",
    price: 12999,
    oldPrice: 14999,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop",
    badge: null
  },
  {
    id: 7,
    name: "Dell XPS 15",
    category: "laptops",
    categoryAr: "لابتوبات",
    price: 67999,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=600&fit=crop",
    badge: null
  },
  {
    id: 8,
    name: "Samsung Galaxy Watch 7",
    category: "wearables",
    categoryAr: "ساعات ذكية",
    price: 11999,
    oldPrice: 13999,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop",
    badge: "عرض"
  }
];

// ===== Cart State =====
let cart = JSON.parse(localStorage.getItem("noirtech_cart")) || [];

// ===== DOM Elements =====
const productsGrid = document.getElementById("productsGrid");
const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const toast = document.getElementById("toast");

// ===== Format Price =====
function formatPrice(price) {
  return price.toLocaleString("ar-EG") + " ج.م";
}

// ===== Render Products =====
function renderProducts(filter = "all") {
  const filtered = filter === "all" ? products : products.filter(p => p.category === filter);
  
  productsGrid.innerHTML = filtered.map(product => `
    <div class="product-card" data-category="${product.category}">
      <div class="product-img">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
      </div>
      <div class="product-info">
        <p class="product-cat">${product.categoryAr}</p>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price">
          <div>
            <span class="price">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ""}
          </div>
          <button class="add-btn" onclick="addToCart(${product.id})" title="أضف للسلة">+</button>
        </div>
      </div>
    </div>
  `).join("");
}

// ===== Cart Functions =====
function saveCart() {
  localStorage.setItem("noirtech_cart", JSON.stringify(cart));
  updateCartUI();
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);
  
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  
  saveCart();
  showToast(`تم إضافة ${product.name} للسلة`);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
  }
}

function updateCartUI() {
  // Count
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalItems;
  
  // Total
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = formatPrice(total);
  
  // Items
  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="cart-empty">السلة فارغة 🛒</div>`;
    return;
  }
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p class="item-price">${formatPrice(item.price)}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
        <button class="remove-item" onclick="removeFromCart(${item.id})">حذف</button>
      </div>
    </div>
  `).join("");
}

// ===== Toast =====
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ===== Cart Open/Close =====
cartBtn.addEventListener("click", () => {
  cartSidebar.classList.add("open");
  cartOverlay.classList.add("open");
});

closeCart.addEventListener("click", closeCartSidebar);
cartOverlay.addEventListener("click", closeCartSidebar);

function closeCartSidebar() {
  cartSidebar.classList.remove("open");
  cartOverlay.classList.remove("open");
}

// ===== Checkout =====
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("السلة فارغة!");
    return;
  }
  showToast("شكراً لطلبك! سيتم التواصل معك قريباً ✨");
  cart = [];
  saveCart();
  closeCartSidebar();
});

// ===== Category Filter =====
document.querySelectorAll(".cat-card").forEach(card => {
  card.addEventListener("click", () => {
    const filter = card.dataset.filter;
    renderProducts(filter);
    
    // Smooth scroll to products
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  });
});

// ===== Navbar Active Link =====
const sections = document.querySelectorAll("section[id]");
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY + 100;
  
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");
    
    if (scrollY >= top && scrollY < top + height) {
      document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));
      const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (activeLink) activeLink.classList.add("active");
    }
  });
});

// ===== Init =====
renderProducts();
updateCartUI();
