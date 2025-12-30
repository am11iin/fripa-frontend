let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Configuration de l'API
function resolveApiBaseUrl() {
  const meta = document.querySelector('meta[name="fripa-api-base-url"]');
  const metaValue = meta && typeof meta.content === 'string' ? meta.content.trim() : '';

  const windowValue = typeof window.FRIPA_API_BASE_URL === 'string' ? window.FRIPA_API_BASE_URL.trim() : '';

  const storageValueRaw = localStorage.getItem('FRIPA_API_BASE_URL');
  const storageValue = typeof storageValueRaw === 'string' ? storageValueRaw.trim() : '';

  const url = metaValue || windowValue || storageValue || 'https://fripa-backend.onrender.com';

  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();
window.FRIPA_API_BASE_URL = API_BASE_URL;

function resolveImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  const url = imageUrl.trim();
  if (url === '') return '';

  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
}

// Fonction utilitaire pour les appels API
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur serveur');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    showToast(error.message || 'Erreur de connexion', 'error');
    throw error;
  }
}

// Système de toast pour les notifications
function showToast(message, type = 'info') {
  // Créer le toast s'il n'existe pas
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Animation d'entrée
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Auto-suppression
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Ajouter au panier avec gestion améliorée
async function addToCart(productId) {
  try {
    // Vérifier si le produit existe
    const product = await apiCall(`/products/${productId}`);
    
    // Ajouter au panier local
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    animateCartCount();
    showToast(`${product.name} ajouté au panier !`, 'success');

  } catch (error) {
    // Fallback: ajouter directement au panier local si le backend est indisponible
    const fallbackProduct = {
      id: productId,
      name: 'Produit',
      price: 0,
      image_url: '',
      quantity: 1
    };

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push(fallbackProduct);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    animateCartCount();
    showToast('Produit ajouté au panier !', 'success');
  }
}

function updateCartCount(){
  const count = document.getElementById('cart-count');
  if (count) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    count.innerText = totalItems;
  }
}

function animateCartCount() {
  const count = document.getElementById('cart-count');
  if (count) {
    count.style.transition = 'transform 0.3s';
    count.style.transform = 'scale(1.2)';
    setTimeout(() => {
      count.style.transform = 'scale(1)';
    }, 300);
  }
}

// Checkout amélioré avec validation
async function checkout() {
  if (cart.length === 0) {
    showToast('Votre panier est vide', 'error');
    return;
  }

  // Créer un formulaire modal au lieu des prompts
  const form = document.createElement('div');
  form.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  form.innerHTML = `
    <div style="background: var(--secondary-black, #1a1a1a); padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
      <h2 style="color: var(--off-white, #f8f8f8); margin-bottom: 1.5rem;">Finaliser la commande</h2>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; color: var(--off-white, #f8f8f8);">Nom complet</label>
        <input type="text" id="userName" required style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #f8f8f8;">
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; color: var(--off-white, #f8f8f8);">Email</label>
        <input type="email" id="userEmail" required style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #f8f8f8;">
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; color: var(--off-white, #f8f8f8);">Téléphone</label>
        <input type="tel" id="userPhone" required style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #f8f8f8;">
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; color: var(--off-white, #f8f8f8);">Adresse</label>
        <textarea id="userAddress" required style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #f8f8f8; min-height: 100px;"></textarea>
      </div>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button onclick="this.closest('div').parentElement.remove()" style="padding: 0.75rem 1.5rem; border: 1px solid #333; background: transparent; color: #f8f8f8; border-radius: 8px; cursor: pointer;">Annuler</button>
        <button onclick="processCheckout(this)" style="padding: 0.75rem 1.5rem; border: none; background: #333; color: #f8f8f8; border-radius: 8px; cursor: pointer;">Confirmer</button>
      </div>
    </div>
  `;

  document.body.appendChild(form);
}

// Traiter le checkout
window.processCheckout = async function(button) {
  const userName = document.getElementById('userName').value;
  const userEmail = document.getElementById('userEmail').value;
  const userPhone = document.getElementById('userPhone').value;
  const userAddress = document.getElementById('userAddress').value;

  if (!userName || !userEmail || !userPhone || !userAddress) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  button.disabled = true;
  button.textContent = 'Traitement...';

  try {
    await apiCall('/checkout', {
      method: 'POST',
      body: JSON.stringify({
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        user_address: userAddress,
        cart: cart
      })
    });

    localStorage.removeItem('cart');
    cart = [];
    updateCartCount();
    button.closest('div').parentElement.remove();
    showToast('Commande validée avec succès !', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);

  } catch (error) {
    button.disabled = false;
    button.textContent = 'Confirmer';
  }
};

// Updated admin login functionality
function adminLoginPrompt() {
  const password = prompt("Entrez le mot de passe admin :");
  if (password === "fripaAdmin123") {
    localStorage.setItem("isAdmin", password);
    showToast("Connexion administrateur réussie !", 'success');
    window.location.href = "admin.html";
  } else {
    showToast("Mot de passe incorrect !", 'error');
  }
}

function checkAdminAccess() {
  const adminSession = localStorage.getItem("isAdmin");
  if (!adminSession || adminSession !== "fripaAdmin123") {
    showToast("Accès refusé : Vous devez être administrateur.", 'error');
    window.location.href = "index.html";
  }
}

window.onload=updateCartCount;
