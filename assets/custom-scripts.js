/**
 * Custom Product Grid with Popup Functionality
 * 100% Vanilla JavaScript - No jQuery
 * 
 * Features:
 * - Product quick view popup
 * - Dynamic variant rendering
 * - Add to cart functionality
 * - Bonus product logic (Black + Medium → adds Soft Winter Jacket)
 * - Keyboard accessibility (ESC to close)
 * - Click-outside-to-close
 * 
 * @author Your Name
 * @version 1.0.0
 */

class ProductPopup {
  /**
   * Constructor - Initialize the popup functionality
   */
  constructor() {
    // DOM Elements
    this.popup = document.getElementById('productPopup');
    this.closeBtn = this.popup?.querySelector('.popup-close');
    this.form = document.getElementById('popupAddToCartForm');
    
    // State
    this.currentProduct = null;
    this.isLoading = false;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize all event listeners
   */
  init() {
    // Attach click handlers to all quick view buttons
    this.attachQuickViewHandlers();
    
    // Close popup handlers
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closePopup());
    }
    
    // Click outside to close
    if (this.popup) {
      this.popup.addEventListener('click', (e) => {
        if (e.target === this.popup) {
          this.closePopup();
        }
      });
    }
    
    // Form submission (Add to Cart)
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }
    
    // ESC key to close popup
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.popup?.classList.contains('active')) {
        this.closePopup();
      }
    });
    
    console.log('ProductPopup initialized successfully');
  }
  
  /**
   * Attach event listeners to all quick view buttons
   */
  attachQuickViewHandlers() {
    const quickViewButtons = document.querySelectorAll('.product-quick-view');
    
    quickViewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const productHandle = button.getAttribute('data-product-handle');
        
        if (productHandle) {
          this.loadProduct(productHandle);
        } else {
          console.error('No product handle found on button');
        }
      });
    });
    
    console.log(`Attached handlers to ${quickViewButtons.length} quick view buttons`);
  }
  
  /**
   * Load product data via Shopify AJAX API
   * @param {string} handle - Product handle
   */
  async loadProduct(handle) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log(`Loading product: ${handle}`);
    
    try {
      const response = await fetch(`/products/${handle}.js`);
      
      if (!response.ok) {
        throw new Error(`Product not found: ${handle}`);
      }
      
      const product = await response.json();
      console.log('Product loaded:', product);
      
      this.currentProduct = product;
      this.renderPopup(product);
      this.openPopup();
      
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Unable to load product details. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Render product information in popup
   * @param {Object} product - Product data from Shopify
   */
  renderPopup(product) {
    // Set product image
    const imageEl = document.getElementById('popupProductImage');
    if (imageEl) {
      if (product.featured_image) {
        imageEl.src = product.featured_image;
        imageEl.alt = product.title;
      } else {
        imageEl.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
        imageEl.alt = 'No image available';
      }
    }
    
    // Set product title
    const titleEl = document.getElementById('popupProductTitle');
    if (titleEl) {
      titleEl.textContent = product.title;
    }
    
    // Set product price
    const priceEl = document.getElementById('popupProductPrice');
    if (priceEl) {
      priceEl.textContent = this.formatMoney(product.price);
    }
    
    // Set product description
    const descEl = document.getElementById('popupProductDescription');
    if (descEl) {
      descEl.innerHTML = product.description || '<p>No description available.</p>';
    }
    
    // Render variants
    this.renderVariants(product);
  }
  
  /**
   * Render product variants dynamically
   * Creates select dropdowns for each product option
   * @param {Object} product - Product data
   */
  renderVariants(product) {
    const variantsContainer = document.getElementById('popupVariants');
    if (!variantsContainer) return;
    
    // Clear existing content
    variantsContainer.innerHTML = '';
    
    // If product has only one variant and it's the default title
    if (product.variants.length === 1 && product.variants[0].title === 'Default Title') {
      // Create hidden input for variant ID
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'id';
      input.value = product.variants[0].id;
      variantsContainer.appendChild(input);
      
      // Update button availability
      this.updateAddToCartButton(product.variants[0]);
      return;
    }
    
    // Get all option names
    const options = product.options;
    
    // Create selectors for each option
    options.forEach((option, index) => {
      if (option.values && option.values.length > 0) {
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'variant-selector';
        
        const label = document.createElement('label');
        label.textContent = option.name;
        label.setAttribute('for', `option-${index}`);
        
        const select = document.createElement('select');
        select.id = `option-${index}`;
        select.name = `option${index + 1}`;
        select.setAttribute('data-option-index', index);
        select.required = true;
        
        // Add options
        option.values.forEach(value => {
          const optionEl = document.createElement('option');
          optionEl.value = value;
          optionEl.textContent = value;
          select.appendChild(optionEl);
        });
        
        // Add change event listener
        select.addEventListener('change', () => this.updateVariant());
        
        selectorDiv.appendChild(label);
        selectorDiv.appendChild(select);
        variantsContainer.appendChild(selectorDiv);
      }
    });
    
    // Create hidden input for selected variant ID
    const variantInput = document.createElement('input');
    variantInput.type = 'hidden';
    variantInput.name = 'id';
    variantInput.id = 'selectedVariantId';
    variantsContainer.appendChild(variantInput);
    
    // Set initial variant
    this.updateVariant();
  }
  
  /**
   * Update selected variant based on option selections
   * Updates price and availability
   */
  updateVariant() {
    if (!this.currentProduct) return;
    
    const selects = document.querySelectorAll('#popupVariants select[data-option-index]');
    const selectedOptions = Array.from(selects).map(select => select.value);
    
    // Find matching variant
    const variant = this.currentProduct.variants.find(v => {
      return selectedOptions.every((option, index) => {
        return v[`option${index + 1}`] === option;
      });
    });
    
    if (variant) {
      // Update hidden variant ID input
      const variantInput = document.getElementById('selectedVariantId');
      if (variantInput) {
        variantInput.value = variant.id;
      }
      
      // Update price if variant has different price
      const priceEl = document.getElementById('popupProductPrice');
      if (priceEl && variant.price) {
        priceEl.textContent = this.formatMoney(variant.price);
      }
      
      // Update add to cart button
      this.updateAddToCartButton(variant);
      
      console.log('Variant selected:', variant);
    } else {
      console.warn('No matching variant found for selection:', selectedOptions);
    }
  }
  
  /**
   * Update Add to Cart button state based on variant availability
   * @param {Object} variant - Selected variant
   */
  updateAddToCartButton(variant) {
    const addBtn = document.querySelector('.btn-add-to-cart');
    const btnText = addBtn?.querySelector('.btn-text');
    
    if (addBtn && btnText) {
      if (variant.available) {
        addBtn.disabled = false;
        btnText.textContent = 'ADD TO CART';
      } else {
        addBtn.disabled = true;
        btnText.textContent = 'SOLD OUT';
      }
    }
  }
  
  /**
   * Add product(s) to cart
   * Includes logic for bonus product when Black + Medium is selected
   */
  async addToCart() {
    const formData = new FormData(this.form);
    const variantId = formData.get('id');
    
    if (!variantId) {
      alert('Please select a variant');
      return;
    }
    
    const addBtn = this.form.querySelector('.btn-add-to-cart');
    const btnText = addBtn.querySelector('.btn-text');
    const btnLoading = addBtn.querySelector('.btn-loading');
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    addBtn.disabled = true;
    
    try {
      // Prepare items to add
      const items = [{
        id: parseInt(variantId),
        quantity: 1
      }];
      
      // Check if we need to add bonus product
      const shouldAddBonus = this.shouldAddBonusProduct(formData);
      console.log('Should add bonus product:', shouldAddBonus);
      
      if (shouldAddBonus) {
        // Fetch the "Soft Winter Jacket" product
        const bonusProduct = await this.getBonusProduct();
        if (bonusProduct) {
          items.push({
            id: bonusProduct.id,
            quantity: 1
          });
          console.log('Adding bonus product:', bonusProduct);
        }
      }
      
      console.log('Adding items to cart:', items);
      
      // Add to cart via AJAX API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to add to cart');
      }
      
      const result = await response.json();
      console.log('Cart response:', result);
      
      // Success feedback
      this.showSuccessMessage();
      
      // Update cart count if you have a cart counter
      this.updateCartCount();
      
      // Close popup after delay
      setTimeout(() => {
        this.closePopup();
      }, 1500);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(`Unable to add product to cart: ${error.message}`);
    } finally {
      // Reset button state
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      addBtn.disabled = false;
    }
  }
  
  /**
   * Check if bonus product should be added
   * Condition: Any variant option is "Black" AND any variant option is "Medium"
   * @param {FormData} formData - Form data with selected options
   * @returns {boolean}
   */
  shouldAddBonusProduct(formData) {
    // Get all option values
    const options = [];
    for (let i = 1; i <= 3; i++) {
      const option = formData.get(`option${i}`);
      if (option) {
        options.push(option.toLowerCase());
      }
    }
    
    // Check if both "black" and "medium" are present (case-insensitive)
    const hasBlack = options.some(opt => opt === 'black');
    const hasMedium = options.some(opt => opt === 'medium');
    
    return hasBlack && hasMedium;
  }
  
  /**
   * Get bonus product variant ID
   * Fetches "Soft Winter Jacket" product and returns first available variant
   * @returns {Object|null} Variant object or null
   */
  async getBonusProduct() {
    try {
      // IMPORTANT: Replace 'soft-winter-jacket' with actual product handle in your store
      const handle = 'soft-winter-jacket';
      
      const response = await fetch(`/products/${handle}.js`);
      
      if (!response.ok) {
        console.warn(`Bonus product "${handle}" not found`);
        return null;
      }
      
      const product = await response.json();
      
      // Return first available variant
      const availableVariant = product.variants.find(v => v.available);
      
      if (!availableVariant) {
        console.warn('Bonus product has no available variants');
        return null;
      }
      
      return availableVariant;
      
    } catch (error) {
      console.error('Error fetching bonus product:', error);
      return null;
    }
  }
  
  /**
   * Show success message in button
   */
  showSuccessMessage() {
    const btnText = this.form.querySelector('.btn-text');
    if (btnText) {
      const originalText = btnText.textContent;
      btnText.textContent = '✓ ADDED TO CART';
      
      setTimeout(() => {
        btnText.textContent = originalText;
      }, 2000);
    }
  }
  
  /**
   * Update cart item count in header
   * Finds elements with class .cart-count or [data-cart-count] attribute
   */
  async updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // Update cart count in header (adjust selector to match your theme)
      const cartCountElements = document.querySelectorAll('.cart-count, [data-cart-count], #cart-icon-bubble');
      
      cartCountElements.forEach(el => {
        el.textContent = cart.item_count;
        
        // Add animation
        el.style.transform = 'scale(1.2)';
        setTimeout(() => {
          el.style.transform = 'scale(1)';
        }, 200);
      });
      
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }
  
  /**
   * Format price in Shopify money format
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price string
   */
  formatMoney(cents) {
    if (typeof cents === 'undefined' || cents === null) {
      return '$0.00';
    }
    
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  }
  
  /**
   * Open popup modal
   */
  openPopup() {
    if (this.popup) {
      this.popup.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Focus management for accessibility
      this.popup.focus();
    }
  }
  
  /**
   * Close popup modal
   */
  closePopup() {
    if (this.popup) {
      this.popup.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      
      // Clear current product
      this.currentProduct = null;
    }
  }
}

// ============================================================================
// Initialize when DOM is ready
// ============================================================================

/**
 * Initialize ProductPopup when DOM is fully loaded
 */
function initProductPopup() {
  try {
    window.productPopup = new ProductPopup();
    console.log('ProductPopup instance created');
  } catch (error) {
    console.error('Error initializing ProductPopup:', error);
  }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPopup);
} else {
  // DOM is already loaded
  initProductPopup();
}

// ============================================================================
// Optional: Expose to window for debugging
// ============================================================================

if (typeof window !== 'undefined') {
  window.ProductPopup = ProductPopup;
}
