/**
 * AURA Store & Application State Management
 * Handles customizer state, pricing math, cart, wishlist, and currency conversions.
 */

export const COLOR_DEFINITIONS = {
  'matte-black': {
    id: 'matte-black',
    name: 'Matte Onyx Black',
    hex: '#18181b',
    finish: 'Satin Anodized',
    priceDiff: 0,
    metalness: 0.15,
    roughness: 0.7,
    motorColor: '#121214',
    accentColor: '#27272a',
    isWood: false
  },
  'champagne-brass': {
    id: 'champagne-brass',
    name: 'Brushed Champagne Brass',
    hex: '#CCA152',
    finish: 'Luxury Brushed Metallic',
    priceDiff: 40,
    metalness: 0.88,
    roughness: 0.28,
    motorColor: '#C49746',
    accentColor: '#D8B062',
    isWood: false
  },
  'american-walnut': {
    id: 'american-walnut',
    name: 'American Walnut & Graphite',
    hex: '#4b2e1e',
    finish: 'Solid Carved Hardwood',
    priceDiff: 60,
    metalness: 0.05,
    roughness: 0.65,
    motorColor: '#242426',
    accentColor: '#CCA152',
    isWood: true,
    woodType: 'walnut'
  },
  'nordic-white': {
    id: 'nordic-white',
    name: 'Scandinavian Nordic White',
    hex: '#FAFAFA',
    finish: 'Velvet Chalk Powdercoat',
    priceDiff: 0,
    metalness: 0.08,
    roughness: 0.65,
    motorColor: '#FFFFFF',
    accentColor: '#E4E4E7',
    isWood: false
  },
  'natural-oak': {
    id: 'natural-oak',
    name: 'Natural Bleached Oak & White',
    hex: '#A0815E',
    finish: 'Organic Blonde Oak',
    priceDiff: 50,
    metalness: 0.05,
    roughness: 0.72,
    motorColor: '#FAFAFA',
    accentColor: '#CCA152',
    isWood: true,
    woodType: 'oak'
  },
  'gunmetal-titanium': {
    id: 'gunmetal-titanium',
    name: 'Titanium Gunmetal',
    hex: '#3D4046',
    finish: 'Aerospace PVD Metallic',
    priceDiff: 30,
    metalness: 0.82,
    roughness: 0.32,
    motorColor: '#2D3035',
    accentColor: '#6B7280',
    isWood: false
  },
  'coastal-sage': {
    id: 'coastal-sage',
    name: 'Coastal Matte Sage',
    hex: '#5E7063',
    finish: 'Matte Ceramic Finish',
    priceDiff: 25,
    metalness: 0.12,
    roughness: 0.68,
    motorColor: '#4A584E',
    accentColor: '#D4AF37',
    isWood: false
  },
  'burnished-copper': {
    id: 'burnished-copper',
    name: 'Burnished Rose Copper',
    hex: '#AC6244',
    finish: 'Mirror Brushed Copper',
    priceDiff: 45,
    metalness: 0.85,
    roughness: 0.3,
    motorColor: '#964E32',
    accentColor: '#222222',
    isWood: false
  }
};

export const MODEL_DEFINITIONS = {
  'vortex-v1': {
    id: 'vortex-v1',
    name: 'Aura Vortex V1 Smart Fan',
    basePrice: 589,
    defaultBlades: 3,
    defaultColor: 'matte-black',
    hasHaloRing: false,
    bladeStyle: 'airfoil'
  },
  'halo-smart': {
    id: 'halo-smart',
    name: 'Aura Halo Smart Ambient',
    basePrice: 649,
    defaultBlades: 3,
    defaultColor: 'champagne-brass',
    hasHaloRing: true,
    bladeStyle: 'halo'
  },
  'zephyr-wood': {
    id: 'zephyr-wood',
    name: 'Aura Zephyr Woodcraft',
    basePrice: 699,
    defaultBlades: 3,
    defaultColor: 'american-walnut',
    hasHaloRing: false,
    bladeStyle: 'carved'
  },
  'stratos-5': {
    id: 'stratos-5',
    name: 'Aura Stratos 5-Blade Grand',
    basePrice: 634,
    defaultBlades: 5,
    defaultColor: 'nordic-white',
    hasHaloRing: false,
    bladeStyle: 'swept'
  }
};

const CURRENCIES = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 }
};

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = {
      // Configuration
      activeModelId: 'vortex-v1',
      selectedColorId: 'matte-black',
      dualTone: false,
      bladeCount: 3,
      bladeSpan: 52, // inches
      downrodLength: 6, // inches
      smartAddon: true,
      quantity: 1,

      // Live fan animation & physics
      fanSpeed: 2, // 0 to 5
      targetRpm: 120,
      currentRpm: 120,
      airflowDirection: 'summer', // 'summer' (counter-clockwise) or 'winter' (clockwise)
      showAirflowParticles: true,
      ceilingTexture: 'white', // 'white', 'concrete', 'wood', 'dark'
      cameraPreset: 'perspective',

      // Integrated light
      lightOn: true,
      lightKelvin: 2700,
      lightBrightness: 85, // 10 to 100%

      // Commerce
      currency: 'USD',
      cart: JSON.parse(localStorage.getItem('aura_cart') || '[]'),
      wishlist: JSON.parse(localStorage.getItem('aura_wishlist') || '[]'),
      promoCode: '',
      discountPercent: 0
    };
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Price calculations
  getCurrentUnitBasePriceUSD() {
    const model = MODEL_DEFINITIONS[this.state.activeModelId] || MODEL_DEFINITIONS['vortex-v1'];
    const color = COLOR_DEFINITIONS[this.state.selectedColorId] || COLOR_DEFINITIONS['matte-black'];

    let price = model.basePrice;
    // Color diff
    price += color.priceDiff;

    // Blade count diff
    if (this.state.bladeCount === 4) price += 25;
    else if (this.state.bladeCount === 5) price += 45;

    // Blade span diff
    if (this.state.bladeSpan === 44) price -= 30;
    else if (this.state.bladeSpan === 60) price += 55;

    // Downrod diff
    if (this.state.downrodLength === 12) price += 25;
    else if (this.state.downrodLength === 24) price += 40;

    // Smart addon
    if (this.state.smartAddon) price += 49;

    return Math.max(299, price);
  }

  formatPrice(usdAmount) {
    const curr = CURRENCIES[this.state.currency] || CURRENCIES.USD;
    const converted = usdAmount * curr.rate;
    return `${curr.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }

  formatPriceDecimal(usdAmount) {
    const curr = CURRENCIES[this.state.currency] || CURRENCIES.USD;
    const converted = usdAmount * curr.rate;
    return `${curr.symbol}${converted.toFixed(2)}`;
  }

  // Cart Management
  addToCart(itemConfig = null) {
    const model = MODEL_DEFINITIONS[this.state.activeModelId];
    const color = COLOR_DEFINITIONS[this.state.selectedColorId];
    const unitPrice = this.getCurrentUnitBasePriceUSD();

    const item = itemConfig || {
      id: `${this.state.activeModelId}-${this.state.selectedColorId}-${this.state.bladeCount}-${this.state.bladeSpan}-${this.state.downrodLength}-${Date.now()}`,
      modelId: this.state.activeModelId,
      modelName: model.name,
      colorId: this.state.selectedColorId,
      colorName: color.name,
      colorHex: color.hex,
      bladeCount: this.state.bladeCount,
      bladeSpan: this.state.bladeSpan,
      downrodLength: this.state.downrodLength,
      smartAddon: this.state.smartAddon,
      unitPriceUSD: unitPrice,
      qty: this.state.quantity || 1
    };

    // Check if an identical configuration exists
    const existingIndex = this.state.cart.findIndex(
      (c) =>
        c.modelId === item.modelId &&
        c.colorId === item.colorId &&
        c.bladeCount === item.bladeCount &&
        c.bladeSpan === item.bladeSpan &&
        c.downrodLength === item.downrodLength &&
        c.smartAddon === item.smartAddon
    );

    let updatedCart = [...this.state.cart];
    if (existingIndex > -1) {
      updatedCart[existingIndex].qty += item.qty;
    } else {
      updatedCart.push(item);
    }

    this.setState({ cart: updatedCart });
    localStorage.setItem('aura_cart', JSON.stringify(updatedCart));
    return item;
  }

  updateCartQty(itemId, newQty) {
    let updatedCart = [...this.state.cart];
    if (newQty <= 0) {
      updatedCart = updatedCart.filter((item) => item.id !== itemId);
    } else {
      const target = updatedCart.find((item) => item.id === itemId);
      if (target) target.qty = newQty;
    }
    this.setState({ cart: updatedCart });
    localStorage.setItem('aura_cart', JSON.stringify(updatedCart));
  }

  removeFromCart(itemId) {
    const updatedCart = this.state.cart.filter((item) => item.id !== itemId);
    this.setState({ cart: updatedCart });
    localStorage.setItem('aura_cart', JSON.stringify(updatedCart));
  }

  clearCart() {
    this.setState({ cart: [], promoCode: '', discountPercent: 0 });
    localStorage.removeItem('aura_cart');
  }

  applyPromo(code) {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'AURA15' || normalized === 'SPRING15') {
      this.setState({ promoCode: normalized, discountPercent: 0.15 });
      return { success: true, message: 'Promo code AURA15 applied: 15% discount!' };
    } else if (normalized === 'FREESHIP') {
      this.setState({ promoCode: normalized, discountPercent: 0 });
      return { success: true, message: 'Free White-Glove Shipping confirmed!' };
    }
    return { success: false, message: 'Invalid or expired promotional code.' };
  }

  getCartTotals() {
    const subtotalUSD = this.state.cart.reduce(
      (sum, item) => sum + item.unitPriceUSD * item.qty,
      0
    );
    const discountUSD = subtotalUSD * this.state.discountPercent;
    const finalTotalUSD = Math.max(0, subtotalUSD - discountUSD);
    const totalCount = this.state.cart.reduce((sum, item) => sum + item.qty, 0);

    return {
      subtotalUSD,
      discountUSD,
      finalTotalUSD,
      totalCount
    };
  }

  // Wishlist
  toggleWishlistCurrent() {
    const model = MODEL_DEFINITIONS[this.state.activeModelId];
    const color = COLOR_DEFINITIONS[this.state.selectedColorId];
    const currentId = `${this.state.activeModelId}-${this.state.selectedColorId}`;

    const exists = this.state.wishlist.some((w) => w.id === currentId);
    let updated;
    if (exists) {
      updated = this.state.wishlist.filter((w) => w.id !== currentId);
    } else {
      updated = [
        ...this.state.wishlist,
        {
          id: currentId,
          modelId: this.state.activeModelId,
          modelName: model.name,
          colorId: this.state.selectedColorId,
          colorName: color.name,
          colorHex: color.hex,
          bladeCount: this.state.bladeCount,
          bladeSpan: this.state.bladeSpan,
          priceUSD: this.getCurrentUnitBasePriceUSD(),
          timestamp: Date.now()
        }
      ];
    }
    this.setState({ wishlist: updated });
    localStorage.setItem('aura_wishlist', JSON.stringify(updated));
    return !exists;
  }

  isInWishlist(modelId, colorId) {
    const id = `${modelId}-${colorId}`;
    return this.state.wishlist.some((w) => w.id === id);
  }
}

export const store = new Store();
