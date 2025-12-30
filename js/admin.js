// Gestion admin via API uniquement
const ADMIN_API_URL = (typeof window.FRIPA_API_BASE_URL === 'string' ? window.FRIPA_API_BASE_URL : 'https://fripa-backend.onrender.com').replace(/\/$/, '');

// Fonction utilitaire pour les appels API
async function adminApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse brute:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { detail: errorText };
      }
      
      console.error('Erreur parsée:', errorData);
    
    // Afficher l'erreur détaillée
    if (errorData.detail && Array.isArray(errorData.detail)) {
      const errorMsg = errorData.detail.map(err => err.msg || err).join(', ');
      throw new Error(`Erreur de validation: ${errorMsg}`);
    }
    
    throw new Error(errorData.detail || 'Erreur serveur');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API Admin complète:', error);
    alert(`Erreur: ${error.message}`);
    throw error;
  }
}

// Afficher les commandes admin
async function displayAdminOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  const adminSession = localStorage.getItem('isAdmin');
  
  try {
    const orders = await adminApiCall('/admin/orders', {
      headers: { 'admin-session': adminSession }
    });

    console.log('Commandes reçues:', orders); // Debug

    if (orders.length === 0) {
      container.innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">Aucune commande pour le moment.</p>';
      return;
    }

    container.innerHTML = orders.map(order => {
      let products = [];
      try {
        products = JSON.parse(order.products || '[]');
        console.log('Produits de la commande:', products); // Debug
      } catch (e) {
        console.error('Erreur parsing produits:', e);
        products = [];
      }
      
      const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR');
      const total = products.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      
      return `
        <div class="order-card" style="background: var(--secondary-black); padding: 1.5rem; margin-bottom: 1rem; border-radius: 12px; border: 1px solid var(--tertiary-black);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h4 style="color: var(--off-white); margin-bottom: 0.5rem;">Commande #${order.id}</h4>
              <p style="color: var(--primary-gray); font-size: 0.9rem;">${orderDate}</p>
            </div>
            <span style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem;">Nouvelle</span>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <h5 style="color: var(--off-white); margin-bottom: 0.5rem;">Client:</h5>
            <p style="color: var(--primary-gray); margin-bottom: 0.25rem;"><strong>${order.user_name}</strong></p>
            <p style="color: var(--primary-gray); margin-bottom: 0.25rem;">${order.user_email}</p>
            <p style="color: var(--primary-gray); margin-bottom: 0.25rem;">${order.user_phone}</p>
            <p style="color: var(--primary-gray);">${order.user_address}</p>
          </div>
          
          <div>
            <h5 style="color: var(--off-white); margin-bottom: 0.5rem;">Produits (${products.length}):</h5>
            ${products.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--tertiary-black);">
                <span style="color: var(--primary-gray);">${item.name || 'Produit'} x${item.quantity || 1}</span>
                <span style="color: var(--off-white); font-weight: bold;">${(item.price || 0) * (item.quantity || 1)} DA</span>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; margin-top: 0.5rem; border-top: 2px solid var(--tertiary-black);">
              <span style="color: var(--off-white); font-weight: bold;">Total:</span>
              <span style="color: var(--off-white); font-weight: bold; font-size: 1.1rem;">${total} DA</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Erreur displayAdminOrders:', error);
    container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Erreur lors du chargement des commandes.</p>';
  }
}

async function addProduct() {
  const name = document.getElementById('product-name').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const description = document.getElementById('product-description').value;
  const image = document.getElementById('product-image').value;
  const adminSession = localStorage.getItem('isAdmin');

  console.log('Données envoyées:', { name, price, description, image, adminSession });

  if (!name || !price || !image) {
    alert('Remplissez au moins le nom, le prix et l\'URL de l\'image !');
    return;
  }

  if (isNaN(price) || price <= 0) {
    alert('Le prix doit être un nombre positif !');
    return;
  }

  try {
    const productData = {
      name: name.trim(),
      price: price,
      image_url: image.trim(),
      description: description.trim() || ""
    };

    console.log('JSON envoyé:', JSON.stringify(productData, null, 2));

    await adminApiCall('/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'admin-session': adminSession 
      },
      body: JSON.stringify(productData)
    });

    alert('Produit ajouté avec succès !');
    displayAdminProducts();
    
    // Vider les champs
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-description').value = '';
    document.getElementById('product-image').value = '';
    
  } catch (error) {
    console.error('Erreur détaillée:', error);
  }
}

async function fetchAdminProducts() {
  try {
    return await adminApiCall('/products');
  } catch (error) {
    return [];
  }
}

async function displayAdminProducts() {
  const container = document.getElementById('admin-products');
  if (!container) return;

  const products = await fetchAdminProducts();

  if (products.length === 0) {
    container.innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">Aucun produit pour le moment.</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="admin-product-card" style="background: var(--secondary-black); padding: 1rem; margin-bottom: 1rem; border-radius: 12px; border: 1px solid var(--tertiary-black);">
      <h4 style="color: var(--off-white); margin-bottom: 0.5rem;">${product.name}</h4>
      <p style="color: var(--primary-gray); margin-bottom: 0.5rem;">${product.description || 'Pas de description'}</p>
      <p style="color: var(--off-white); font-weight: bold; margin-bottom: 0.5rem;">${product.price} DA</p>
      <button onclick="deleteProduct(${product.id})" style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 0.5rem 1rem; cursor: pointer;">Supprimer</button>
    </div>
  `).join('');
}

async function deleteProduct(productId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
  
  const adminSession = localStorage.getItem('isAdmin');

  try {
    await adminApiCall(`/products/${productId}`, {
      method: 'DELETE',
      headers: { 'admin-session': adminSession }
    });

    alert('Produit supprimé avec succès !');
    displayAdminProducts();
  } catch (error) {
    // L'erreur est déjà gérée par apiCall
  }
}

// Initialisation
window.onload = () => {
  displayAdminProducts();
  displayAdminOrders();
};
