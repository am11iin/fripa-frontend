let storedProducts = JSON.parse(localStorage.getItem('products')) || [
  {id:1,name:"T-shirt Noir",price:25,image:"assets/images/tshirt1.jpg"},
  {id:2,name:"Pull Gris",price:40,image:"assets/images/pull1.jpg"},
  {id:3,name:"Jeans Slim",price:60,image:"assets/images/jeans1.jpg"}
];

const products = storedProducts.length > 0 ? storedProducts : [
  { id: 1, name: "Produit Noir Élégant", price: 5000, description: "Un produit moderne et minimaliste." },
  { id: 2, name: "Produit Blanc Pur", price: 7000, description: "Un produit élégant et intemporel." }
];

function displayProductsLocal(containerId){
  const container = document.getElementById(containerId);
  container.innerHTML='';
  products.forEach(p=>{
    const card=document.createElement('div');
    card.className='product-card';
    card.innerHTML=`
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.price} €</p>
      <button class="btn-primary" onclick="addToCart(${p.id})">Ajouter au panier</button>
    `;
    container.appendChild(card);
  });
}

displayProducts('featured-products');

function searchProducts(){
  const query = (document.getElementById('search-bar')?.value || '').trim();
  displayFilteredProducts('products-container', query);
}

async function fetchProducts() {
  return await apiCall('/products');
}

async function displayProducts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const products = await fetchProducts();

  const productsToRender = containerId === 'featured-products' ? products.slice(0, 4) : products;

  container.innerHTML = productsToRender.map(product => `
    <div class="product-card">
      <img src="${resolveImageUrl(product.image_url)}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Prix : ${product.price} DA</p>
      <button class="btn-primary" onclick="addToCart(${product.id})">Ajouter au panier</button>
    </div>
  `).join('');
}

displayProducts('products-container');

// Updated to include product search and category filtering
async function searchAndFilterProducts(query = "", category = "") {
  const q = encodeURIComponent(query || "");
  const c = encodeURIComponent(category || "");
  return await apiCall(`/products/search?query=${q}&category=${c}`);
}

async function displayFilteredProducts(containerId, query = "", category = "") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const products = await searchAndFilterProducts(query, category);

  container.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${resolveImageUrl(product.image_url)}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Prix : ${product.price} DA</p>
      <button class="btn-primary" onclick="addToCart(${product.id})">Ajouter au panier</button>
    </div>
  `).join('');
}

// Event listener for search bar
const searchBar = document.getElementById('search-bar');
if (searchBar) {
  searchBar.addEventListener('input', (e) => {
    const query = e.target.value;
    displayFilteredProducts('products-container', query);
  });
}
