import { createIcons, icons } from 'lucide';
import confetti from 'canvas-confetti';
import { store, COLOR_DEFINITIONS, MODEL_DEFINITIONS } from './store.js';
import { CeilingFanScene } from './fan-3d.js';
import { audioEngine } from './audio.js';

/**
 * Main Application Orchestrator
 */
class App {
  constructor() {
    this.fanScene = null;
    this.init();
  }

  init() {
    // 1. Initialize Lucide Icons
    this.renderIcons();

    // 2. Initialize 3D Ceiling Fan Scene
    this.init3DScene();

    // 3. Bind UI Event Handlers
    this.bindNavigation();
    this.bindSwatches();
    this.bindConfigurationPills();
    this.bindFanControls();
    this.bindCartAndCheckout();
    this.bindRoomCalculator();
    this.bindCatalogCards();
    this.bindFAQ();
    this.bindAudioToggle();
    this.bindCurrency();

    // 4. Subscribe to Store State Changes
    store.subscribe((state) => this.handleStateChange(state));

    // Initial render
    this.updateUIFromState(store.getState());
  }

  renderIcons() {
    createIcons({ icons });
  }

  init3DScene() {
    const mountEl = document.getElementById('webglMount');
    const loaderEl = document.getElementById('viewerLoader');

    if (!mountEl) return;

    this.fanScene = new CeilingFanScene(mountEl, (telemetry) => {
      this.updateTelemetryHUD(telemetry);
    });

    // Initial configuration for 3D fan
    const initialState = store.getState();
    const initialColor = COLOR_DEFINITIONS[initialState.selectedColorId];
    this.fanScene.applyColorConfig(initialColor, initialState.dualTone);
    this.fanScene.setSpeed(initialState.fanSpeed);
    this.fanScene.setDirection(initialState.airflowDirection);
    this.fanScene.setLightState(
      initialState.lightOn,
      initialState.lightKelvin,
      initialState.lightBrightness
    );

    // Hide loader smoothly
    setTimeout(() => {
      if (loaderEl) loaderEl.classList.add('hidden');
    }, 450);
  }

  updateTelemetryHUD(telemetry) {
    const hudRpm = document.getElementById('hudRpm');
    const hudCfm = document.getElementById('hudCfm');
    const hudDb = document.getElementById('hudDb');
    const hudSpeedLabel = document.getElementById('hudSpeedLabel');
    const liveSpeedDot = document.getElementById('liveSpeedDot');

    if (hudRpm) hudRpm.textContent = telemetry.rpm;
    if (hudCfm) hudCfm.textContent = telemetry.cfm.toLocaleString();
    if (hudDb) hudDb.textContent = telemetry.db;

    if (liveSpeedDot) {
      if (telemetry.rpm === 0) {
        liveSpeedDot.classList.add('stopped');
      } else {
        liveSpeedDot.classList.remove('stopped');
      }
    }

    if (hudSpeedLabel) {
      const speedLabels = [
        'STANDBY (OFF)',
        'WHISPER (SPEED 1)',
        'GENTLE BREEZE (SPEED 2)',
        'COMFORT AIRFLOW (SPEED 3)',
        'HIGH VELOCITY (SPEED 4)',
        'TURBO CYCLONE (SPEED 5)'
      ];
      hudSpeedLabel.textContent = speedLabels[telemetry.speed] || 'ACTIVE';
    }
  }

  // CORE COLOR SWATCHES BINDING
  bindSwatches() {
    const swatchesContainer = document.getElementById('swatchesContainer');
    const dualToneToggle = document.getElementById('dualToneToggle');

    if (swatchesContainer) {
      swatchesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.swatch-btn');
        if (!btn) return;

        const colorId = btn.dataset.colorId;
        if (!colorId || !COLOR_DEFINITIONS[colorId]) return;

        // Update active class
        swatchesContainer.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Update store
        store.setState({ selectedColorId: colorId });

        // Instantly update spinning 3D fan colors
        const colorDef = COLOR_DEFINITIONS[colorId];
        const isDualTone = store.getState().dualTone;
        if (this.fanScene) {
          this.fanScene.applyColorConfig(colorDef, isDualTone);
        }

        this.showToast(`Applied Finish: ${colorDef.name}`, 'info');
      });
    }

    if (dualToneToggle) {
      dualToneToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        store.setState({ dualTone: enabled });

        const currentColor = COLOR_DEFINITIONS[store.getState().selectedColorId];
        if (this.fanScene) {
          this.fanScene.applyColorConfig(currentColor, enabled);
        }
        this.showToast(
          enabled ? 'Dual-Tone Architectural Finish Engaged' : 'Monochrome Finish Restored',
          'info'
        );
      });
    }
  }

  bindConfigurationPills() {
    // 1. Blade Count
    const bladeCountContainer = document.getElementById('bladeCountContainer');
    if (bladeCountContainer) {
      bladeCountContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.option-pill');
        if (!pill) return;
        const count = parseInt(pill.dataset.blades, 10);
        bladeCountContainer.querySelectorAll('.option-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        store.setState({ bladeCount: count });
        if (this.fanScene) this.fanScene.setBladeCount(count);
      });
    }

    // 2. Blade Span
    const bladeSpanContainer = document.getElementById('bladeSpanContainer');
    if (bladeSpanContainer) {
      bladeSpanContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.option-pill');
        if (!pill) return;
        const span = parseInt(pill.dataset.span, 10);
        bladeSpanContainer.querySelectorAll('.option-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        store.setState({ bladeSpan: span });
        if (this.fanScene) this.fanScene.setBladeSpan(span);
      });
    }

    // 3. Downrod Suspension
    const downrodContainer = document.getElementById('downrodContainer');
    if (downrodContainer) {
      downrodContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.option-pill');
        if (!pill) return;
        const rod = parseInt(pill.dataset.downrod, 10);
        downrodContainer.querySelectorAll('.option-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        store.setState({ downrodLength: rod });
        if (this.fanScene) this.fanScene.setDownrodLength(rod);
      });
    }

    // 4. Smart Kit Addon Checkbox
    const smartAddonCheckbox = document.getElementById('smartAddonCheckbox');
    if (smartAddonCheckbox) {
      smartAddonCheckbox.addEventListener('change', (e) => {
        store.setState({ smartAddon: e.target.checked });
      });
    }

    // 5. Quantity Stepper
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const configuredQty = document.getElementById('configuredQty');

    if (qtyMinus && qtyPlus && configuredQty) {
      qtyMinus.addEventListener('click', () => {
        const current = store.getState().quantity || 1;
        if (current > 1) {
          store.setState({ quantity: current - 1 });
        }
      });
      qtyPlus.addEventListener('click', () => {
        const current = store.getState().quantity || 1;
        store.setState({ quantity: current + 1 });
      });
    }
  }

  bindFanControls() {
    // 1. Fan Speed Steps (OFF, 1, 2, 3, 4, 5)
    const speedStepsContainer = document.getElementById('speedStepsContainer');
    const speedDisplayTxt = document.getElementById('speedDisplayTxt');
    if (speedStepsContainer) {
      speedStepsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.speed-step-btn');
        if (!btn) return;
        const speed = parseInt(btn.dataset.speed, 10);

        speedStepsContainer.querySelectorAll('.speed-step-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        store.setState({ fanSpeed: speed });
        if (this.fanScene) this.fanScene.setSpeed(speed);
        audioEngine.setSpeed(speed);

        const speedNames = ['OFF', '1 (Whisper)', '2 (Gentle)', '3 (Comfort)', '4 (High)', '5 (Turbo)'];
        if (speedDisplayTxt) speedDisplayTxt.textContent = speedNames[speed] || speed;
        this.showToast(`Fan set to Speed ${speed}: ${speedNames[speed]}`, 'info');
      });
    }

    // 2. Airflow Direction (Summer vs Winter)
    const dirSummerBtn = document.getElementById('dirSummerBtn');
    const dirWinterBtn = document.getElementById('dirWinterBtn');
    const dirModeTxt = document.getElementById('dirModeTxt');

    if (dirSummerBtn && dirWinterBtn) {
      dirSummerBtn.addEventListener('click', () => {
        dirSummerBtn.classList.add('active');
        dirWinterBtn.classList.remove('active');
        store.setState({ airflowDirection: 'summer' });
        if (this.fanScene) this.fanScene.setDirection('summer');
        if (dirModeTxt) dirModeTxt.textContent = 'Summer Downdraft';
        this.showToast('Summer Mode: Downdraft cooling breeze activated', 'info');
      });

      dirWinterBtn.addEventListener('click', () => {
        dirWinterBtn.classList.add('active');
        dirSummerBtn.classList.remove('active');
        store.setState({ airflowDirection: 'winter' });
        if (this.fanScene) this.fanScene.setDirection('winter');
        if (dirModeTxt) dirModeTxt.textContent = 'Winter Updraft';
        this.showToast('Winter Mode: Updraft circulating warm air near ceiling', 'info');
      });
    }

    // 3. Integrated LED Light Controls
    const lightToggleBtn = document.getElementById('lightToggleBtn');
    const kelvinContainer = document.getElementById('kelvinContainer');
    const brightnessSlider = document.getElementById('lightBrightnessSlider');
    const brightnessVal = document.getElementById('brightnessVal');

    if (lightToggleBtn) {
      lightToggleBtn.addEventListener('click', () => {
        const newState = !store.getState().lightOn;
        store.setState({ lightOn: newState });
        lightToggleBtn.classList.toggle('active', newState);
        const strongEl = lightToggleBtn.querySelector('strong');
        if (strongEl) strongEl.textContent = newState ? 'ON' : 'OFF';

        const s = store.getState();
        if (this.fanScene) this.fanScene.setLightState(newState, s.lightKelvin, s.lightBrightness);
        this.showToast(`LED Light Kit ${newState ? 'Illuminated' : 'Turned Off'}`, 'info');
      });
    }

    if (kelvinContainer) {
      kelvinContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.kelvin-chip');
        if (!chip) return;
        const kelvin = parseInt(chip.dataset.kelvin, 10);
        kelvinContainer.querySelectorAll('.kelvin-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        store.setState({ lightKelvin: kelvin, lightOn: true });
        if (lightToggleBtn) {
          lightToggleBtn.classList.add('active');
          lightToggleBtn.textContent = 'ON';
        }

        const s = store.getState();
        if (this.fanScene) this.fanScene.setLightState(true, kelvin, s.lightBrightness);
      });
    }

    if (brightnessSlider && brightnessVal) {
      brightnessSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        brightnessVal.textContent = `${val}%`;
        store.setState({ lightBrightness: val });

        const s = store.getState();
        if (this.fanScene) this.fanScene.setLightState(s.lightOn, s.lightKelvin, val);
      });
    }

    // 4. Airflow Particles Toggle
    const airflowParticlesToggle = document.getElementById('airflowParticlesToggle');
    if (airflowParticlesToggle) {
      airflowParticlesToggle.addEventListener('click', () => {
        const current = store.getState().showAirflowParticles;
        const next = !current;
        store.setState({ showAirflowParticles: next });
        airflowParticlesToggle.classList.toggle('active', next);
        airflowParticlesToggle.querySelector('strong').textContent = next ? 'ON' : 'OFF';
        if (this.fanScene) this.fanScene.particlesActive = next;
      });
    }

    // 5. Ceiling Texture Toggle
    const ceilingSurfaceToggle = document.getElementById('ceilingSurfaceToggle');
    const ceilingSurfaceLabel = document.getElementById('ceilingSurfaceLabel');
    const ceilingPresets = [
      { id: 'white', label: 'Modern White' },
      { id: 'concrete', label: 'Architectural Concrete' },
      { id: 'wood', label: 'Wood Slats Loft' },
      { id: 'dark', label: 'Obsidian Minimal' }
    ];
    let ceilingIdx = 0;

    if (ceilingSurfaceToggle && ceilingSurfaceLabel) {
      ceilingSurfaceToggle.addEventListener('click', () => {
        ceilingIdx = (ceilingIdx + 1) % ceilingPresets.length;
        const selected = ceilingPresets[ceilingIdx];
        ceilingSurfaceLabel.textContent = selected.label;
        store.setState({ ceilingTexture: selected.id });
        if (this.fanScene) this.fanScene.setCeilingTexture(selected.id);
        this.showToast(`Ceiling Ambient: ${selected.label}`, 'info');
      });
    }

    // 6. Camera View Bar
    const cameraBar = document.querySelector('.camera-controls-bar');
    if (cameraBar) {
      cameraBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.cam-btn');
        if (!btn) return;

        if (btn.id === 'resetCamBtn') {
          if (this.fanScene) this.fanScene.setCameraView('perspective');
          cameraBar.querySelectorAll('.cam-btn[data-view]').forEach((b) => b.classList.remove('active'));
          const persBtn = cameraBar.querySelector('[data-view="perspective"]');
          if (persBtn) persBtn.classList.add('active');
          return;
        }

        const view = btn.dataset.view;
        if (!view) return;

        cameraBar.querySelectorAll('.cam-btn[data-view]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (this.fanScene) this.fanScene.setCameraView(view);
      });
    }
  }

  bindAudioToggle() {
    const ambientSoundBtn = document.getElementById('ambientSoundBtn');
    const soundIcon = document.getElementById('soundIcon');

    if (ambientSoundBtn) {
      ambientSoundBtn.addEventListener('click', () => {
        const isPlaying = audioEngine.toggleSound();
        ambientSoundBtn.classList.toggle('active', isPlaying);

        if (soundIcon) {
          soundIcon.setAttribute('data-lucide', isPlaying ? 'volume-2' : 'volume-x');
          this.renderIcons();
        }

        this.showToast(
          isPlaying ? 'Natural Airflow Acoustic Breeze: Activated' : 'Acoustic Sound Muted',
          'info'
        );
      });
    }
  }

  bindCurrency() {
    const currencyPicker = document.getElementById('currencyPicker');
    if (currencyPicker) {
      currencyPicker.addEventListener('change', (e) => {
        store.setState({ currency: e.target.value });
      });
    }
  }

  bindNavigation() {
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const sections = [
      document.getElementById('studio-section'),
      document.getElementById('collections-section'),
      document.getElementById('tech-specs'),
      document.getElementById('room-calculator'),
      document.getElementById('reviews-section')
    ].filter(Boolean);

    // 1. Direct click on nav link: smooth scroll and immediately highlight active item
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        e.preventDefault();

        const targetId = href.substring(1);
        const targetEl = document.getElementById(targetId);

        navLinks.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');

        if (targetEl) {
          const header = document.getElementById('mainHeader');
          const headerHeight = header ? header.offsetHeight : 72;
          const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerHeight + 2;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // 2. Active Section Scroll Spy via IntersectionObserver
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.2]
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  bindCartAndCheckout() {
    const cartDrawerBtn = document.getElementById('cartDrawerBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const instantBuyBtn = document.getElementById('instantBuyBtn');
    const addWishlistBtn = document.getElementById('addWishlistBtn');
    const wishlistToggleBtn = document.getElementById('wishlistToggleBtn');
    const closeWishlistBtn = document.getElementById('closeWishlistBtn');
    const wishlistDrawer = document.getElementById('wishlistDrawer');
    const wishlistOverlay = document.getElementById('wishlistOverlay');

    // Cart Drawer Toggle
    const openCart = () => {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      this.renderCartItems();
    };

    const closeCart = () => {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    };

    if (cartDrawerBtn) cartDrawerBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Wishlist Drawer Toggle
    const openWishlist = () => {
      wishlistDrawer.classList.add('open');
      wishlistOverlay.classList.add('open');
      this.renderWishlistItems();
    };

    const closeWishlist = () => {
      wishlistDrawer.classList.remove('open');
      wishlistOverlay.classList.remove('open');
    };

    if (wishlistToggleBtn) wishlistToggleBtn.addEventListener('click', openWishlist);
    if (closeWishlistBtn) closeWishlistBtn.addEventListener('click', closeWishlist);
    if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlist);

    // Add to Cart Click
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        const item = store.addToCart();
        this.showToast(`Added ${item.modelName} (${item.colorName}) to Bag`, 'success');
        openCart();
      });
    }

    // Instant Buy
    if (instantBuyBtn) {
      instantBuyBtn.addEventListener('click', () => {
        store.addToCart();
        this.openCheckoutModal();
      });
    }

    // Wishlist Button
    if (addWishlistBtn) {
      addWishlistBtn.addEventListener('click', () => {
        const added = store.toggleWishlistCurrent();
        addWishlistBtn.classList.toggle('active', added);
        this.showToast(
          added ? 'Fan Configuration Saved to Wishlist' : 'Removed from Saved Wishlist',
          'info'
        );
      });
    }

    // Promo Code
    const applyPromoBtn = document.getElementById('applyPromoBtn');
    const promoCodeInput = document.getElementById('promoCodeInput');
    const promoFeedback = document.getElementById('promoFeedback');

    if (applyPromoBtn && promoCodeInput) {
      applyPromoBtn.addEventListener('click', () => {
        const res = store.applyPromo(promoCodeInput.value);
        if (promoFeedback) {
          promoFeedback.className = `promo-feedback ${res.success ? 'success' : 'error'}`;
          promoFeedback.textContent = res.message;
        }
        if (res.success) {
          this.showToast('15% Promo Discount Applied!', 'success');
        }
      });
    }

    // Cart Items click (quantity +/- or remove)
    const cartItemsList = document.getElementById('cartItemsList');
    if (cartItemsList) {
      cartItemsList.addEventListener('click', (e) => {
        const target = e.target;
        const itemCard = target.closest('.cart-item-card');
        if (!itemCard) return;
        const itemId = itemCard.dataset.itemId;

        if (target.closest('.item-remove-btn')) {
          store.removeFromCart(itemId);
          this.renderCartItems();
          return;
        }

        if (target.closest('.item-qty-plus')) {
          const item = store.getState().cart.find((i) => i.id === itemId);
          if (item) store.updateCartQty(itemId, item.qty + 1);
          this.renderCartItems();
          return;
        }

        if (target.closest('.item-qty-minus')) {
          const item = store.getState().cart.find((i) => i.id === itemId);
          if (item) store.updateCartQty(itemId, item.qty - 1);
          this.renderCartItems();
          return;
        }
      });
    }

    // Proceed to Checkout
    const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
    if (proceedCheckoutBtn) {
      proceedCheckoutBtn.addEventListener('click', () => {
        closeCart();
        this.openCheckoutModal();
      });
    }

    // Checkout Modal Setup
    this.bindCheckoutModal();
  }

  bindCheckoutModal() {
    const modalOverlay = document.getElementById('checkoutModalOverlay');
    const closeModalBtn = document.getElementById('closeCheckoutModalBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const applePayBtn = document.getElementById('applePayBtn');
    const googlePayBtn = document.getElementById('googlePayBtn');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');

    const closeModal = () => {
      modalOverlay.classList.remove('open');
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    // Form Submission
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processSuccessfulOrder();
      });
    }

    // Express Apple / Google Pay
    if (applePayBtn) {
      applePayBtn.addEventListener('click', () => this.processSuccessfulOrder());
    }
    if (googlePayBtn) {
      googlePayBtn.addEventListener('click', () => this.processSuccessfulOrder());
    }

    if (continueShoppingBtn) {
      continueShoppingBtn.addEventListener('click', () => {
        closeModal();
        const successStep = document.getElementById('checkoutSuccessStep');
        const formStep = document.getElementById('checkoutFormStep');
        if (successStep) successStep.style.display = 'none';
        if (formStep) formStep.style.display = 'block';
      });
    }
  }

  openCheckoutModal() {
    const modalOverlay = document.getElementById('checkoutModalOverlay');
    const formStep = document.getElementById('checkoutFormStep');
    const successStep = document.getElementById('checkoutSuccessStep');
    const modalSubtotal = document.getElementById('modalSubtotal');
    const modalTotal = document.getElementById('modalTotal');

    if (!modalOverlay) return;

    if (formStep) formStep.style.display = 'block';
    if (successStep) successStep.style.display = 'none';

    const totals = store.getCartTotals();
    if (modalSubtotal) modalSubtotal.textContent = store.formatPriceDecimal(totals.subtotalUSD);
    if (modalTotal) modalTotal.textContent = store.formatPriceDecimal(totals.finalTotalUSD);

    modalOverlay.classList.add('open');
  }

  processSuccessfulOrder() {
    const formStep = document.getElementById('checkoutFormStep');
    const successStep = document.getElementById('checkoutSuccessStep');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const successOrderCard = document.getElementById('successOrderCard');

    // Trigger celebration confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    const randomId = `#AUR-${Math.floor(100000 + Math.random() * 900000)}`;
    if (orderIdDisplay) orderIdDisplay.textContent = randomId;

    const totals = store.getCartTotals();
    const items = store.getState().cart;

    if (successOrderCard) {
      successOrderCard.innerHTML = `
        <div style="font-weight:700; margin-bottom:8px; color:#fff;">Order Summary (${items.length} Custom Units):</div>
        ${items
          .map(
            (i) => `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${i.qty}x ${i.modelName} (${i.colorName}, ${i.bladeSpan}")</span>
            <strong>${store.formatPriceDecimal(i.unitPriceUSD * i.qty)}</strong>
          </div>
        `
          )
          .join('')}
        <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-weight:800; color:var(--accent-gold);">
          <span>Total Paid:</span>
          <span>${store.formatPriceDecimal(totals.finalTotalUSD)}</span>
        </div>
      `;
    }

    if (formStep) formStep.style.display = 'none';
    if (successStep) successStep.style.display = 'flex';

    // Clear cart
    store.clearCart();
    this.renderCartItems();
    this.showToast('Order Successfully Placed!', 'success');
  }

  renderCartItems() {
    const listEl = document.getElementById('cartItemsList');
    const emptyEl = document.getElementById('emptyCartState');
    const drawerSubtotal = document.getElementById('drawerSubtotal');
    const drawerTotal = document.getElementById('drawerTotal');
    const drawerDiscount = document.getElementById('drawerDiscount');
    const discountRow = document.getElementById('discountRow');
    const drawerItemCount = document.getElementById('drawerItemCount');
    const cartCount = document.getElementById('cartCount');

    const state = store.getState();
    const totals = store.getCartTotals();

    if (cartCount) cartCount.textContent = totals.totalCount;
    if (drawerItemCount) drawerItemCount.textContent = totals.totalCount;

    if (drawerSubtotal) drawerSubtotal.textContent = store.formatPriceDecimal(totals.subtotalUSD);
    if (drawerTotal) drawerTotal.textContent = store.formatPriceDecimal(totals.finalTotalUSD);

    if (totals.discountUSD > 0 && discountRow && drawerDiscount) {
      discountRow.style.display = 'flex';
      drawerDiscount.textContent = `-${store.formatPriceDecimal(totals.discountUSD)}`;
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }

    if (!listEl) return;

    if (state.cart.length === 0) {
      listEl.innerHTML = `
        <div class="empty-cart-state" id="emptyCartState">
          <i data-lucide="package-open" class="empty-cart-icon"></i>
          <h4>Your Bag is Empty</h4>
          <p>Customize your ceiling fan in the 3D studio above and click "Add to Bag" to see your order summary.</p>
        </div>
      `;
      this.renderIcons();
      return;
    }

    listEl.innerHTML = state.cart
      .map(
        (item) => `
      <div class="cart-item-card" data-item-id="${item.id}">
        <div class="item-swatch-box" style="background: ${item.colorHex};">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" opacity="0.8">
            <path d="M12 12 L12 2 C14 2 15 4 14 7 Z" />
            <path d="M12 12 L20.6 17 C19.6 18.7 17 19.3 14.5 18 Z" />
            <path d="M12 12 L3.4 17 C3.4 15 5.2 13 8 14.5 Z" />
          </svg>
        </div>
        <div class="item-info">
          <div class="item-title-row">
            <span class="item-name">${item.modelName}</span>
            <span class="item-price">${store.formatPriceDecimal(item.unitPriceUSD * item.qty)}</span>
          </div>
          <div class="item-specs">
            ${item.colorName} • ${item.bladeSpan}" Span • ${item.bladeCount} Blades • ${item.downrodLength ? `${item.downrodLength}" Rod` : 'Flush'}
          </div>
          <div class="item-bottom-row">
            <div class="item-qty-control">
              <button class="item-qty-btn item-qty-minus">−</button>
              <span class="item-qty-val">${item.qty}</span>
              <button class="item-qty-btn item-qty-plus">+</button>
            </div>
            <button class="item-remove-btn">Remove</button>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    this.renderIcons();
  }

  renderWishlistItems() {
    const listEl = document.getElementById('wishlistItemsList');
    const countEl = document.getElementById('wishlistCount');
    const drawerCountEl = document.getElementById('drawerWishlistCount');
    const wishlist = store.getState().wishlist;

    if (countEl) countEl.textContent = wishlist.length;
    if (drawerCountEl) drawerCountEl.textContent = wishlist.length;

    if (!listEl) return;

    if (wishlist.length === 0) {
      listEl.innerHTML = `
        <div class="empty-cart-state">
          <i data-lucide="heart" class="empty-cart-icon"></i>
          <h4>No Saved Fans Yet</h4>
          <p>Click the heart icon on any configured fan to save it to your design board.</p>
        </div>
      `;
      this.renderIcons();
      return;
    }

    listEl.innerHTML = wishlist
      .map(
        (item) => `
      <div class="cart-item-card">
        <div class="item-swatch-box" style="background: ${item.colorHex};"></div>
        <div class="item-info">
          <div class="item-title-row">
            <span class="item-name">${item.modelName}</span>
            <span class="item-price">${store.formatPrice(item.priceUSD)}</span>
          </div>
          <div class="item-specs">${item.colorName} • ${item.bladeSpan}" Diameter</div>
          <div class="item-bottom-row" style="margin-top:10px;">
            <button class="btn btn-outline-sm load-wishlist-studio-btn" data-model="${item.modelId}" data-color="${item.colorId}">
              Configure in 3D
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    listEl.querySelectorAll('.load-wishlist-studio-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.loadModelAndColorIntoStudio(btn.dataset.model, btn.dataset.color);
        const wishlistDrawer = document.getElementById('wishlistDrawer');
        const wishlistOverlay = document.getElementById('wishlistOverlay');
        if (wishlistDrawer) wishlistDrawer.classList.remove('open');
        if (wishlistOverlay) wishlistOverlay.classList.remove('open');
      });
    });

    this.renderIcons();
  }

  bindCatalogCards() {
    const catalogGrid = document.getElementById('catalogGrid');
    if (!catalogGrid) return;

    // Load in 3D Button
    catalogGrid.querySelectorAll('.load-studio-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.catalog-card');
        const modelId = card.dataset.model;
        const activeColorDot = card.querySelector('.color-dot.active');
        const colorHex = activeColorDot ? activeColorDot.dataset.color : null;

        // Find colorId matching hex
        let matchingColorId = 'matte-black';
        Object.values(COLOR_DEFINITIONS).forEach((c) => {
          if (c.hex.toLowerCase() === (colorHex || '').toLowerCase()) {
            matchingColorId = c.id;
          }
        });

        this.loadModelAndColorIntoStudio(modelId, matchingColorId);
      });
    });

    // Card Color Dots
    catalogGrid.querySelectorAll('.card-color-picker').forEach((picker) => {
      picker.addEventListener('click', (e) => {
        const dot = e.target.closest('.color-dot');
        if (!dot) return;
        picker.querySelectorAll('.color-dot').forEach((d) => d.classList.remove('active'));
        dot.classList.add('active');

        const card = dot.closest('.catalog-card');
        const preview = card.querySelector('.card-fan-preview');
        const hex = dot.dataset.color;
        if (preview && hex) {
          preview.style.setProperty('--fan-color', hex);
        }
      });
    });
  }

  loadModelAndColorIntoStudio(modelId, colorId) {
    const model = MODEL_DEFINITIONS[modelId];
    const color = COLOR_DEFINITIONS[colorId];
    if (!model || !color) return;

    store.setState({
      activeModelId: modelId,
      selectedColorId: colorId,
      bladeCount: model.defaultBlades
    });

    // Update 3D scene
    if (this.fanScene) {
      this.fanScene.setModel(modelId);
      this.fanScene.applyColorConfig(color, store.getState().dualTone);
      this.fanScene.setBladeCount(model.defaultBlades);
    }

    // Update swatches selection
    const swatchesContainer = document.getElementById('swatchesContainer');
    if (swatchesContainer) {
      swatchesContainer.querySelectorAll('.swatch-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.colorId === colorId);
      });
    }

    // Scroll to 3D studio smoothly
    const studioSection = document.getElementById('studio-section');
    if (studioSection) {
      studioSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.showToast(`Loaded ${model.name} in ${color.name} into 3D Studio!`, 'success');
  }

  bindRoomCalculator() {
    const lenInput = document.getElementById('roomLengthInput');
    const widthInput = document.getElementById('roomWidthInput');
    const heightInput = document.getElementById('ceilingHeightInput');

    const lenVal = document.getElementById('roomLengthVal');
    const widthVal = document.getElementById('roomWidthVal');
    const heightVal = document.getElementById('ceilingHeightVal');

    const areaEl = document.getElementById('calcArea');
    const recSpanEl = document.getElementById('recSpan');
    const recDownrodEl = document.getElementById('recDownrod');
    const recCfmEl = document.getElementById('recCfm');
    const applyBtn = document.getElementById('applyRecToStudioBtn');

    const calculate = () => {
      const length = parseFloat(lenInput.value);
      const width = parseFloat(widthInput.value);
      const height = parseFloat(heightInput.value);

      lenVal.textContent = `${length} ft`;
      widthVal.textContent = `${width} ft`;
      heightVal.textContent = `${height.toFixed(1)} ft`;

      const sqft = Math.round(length * width);
      areaEl.textContent = sqft;

      // Span logic
      let span = 52;
      let spanDesc = '52" Diameter Airfoil (Balanced)';
      if (sqft < 144) {
        span = 44;
        spanDesc = '44" Compact Diameter (Quiet Efficiency)';
      } else if (sqft > 280) {
        span = 60;
        spanDesc = '60" Grand Diameter (Maximum Coverage)';
      }

      // Downrod logic
      let downrod = 6;
      let downrodDesc = '6" Standard Suspension (8-9 ft)';
      if (height < 8.2) {
        downrod = 0;
        downrodDesc = 'Flush Hugger Mount (Low Clearance)';
      } else if (height >= 10 && height < 12) {
        downrod = 12;
        downrodDesc = '12" Extended Drop (10-11 ft)';
      } else if (height >= 12) {
        downrod = 24;
        downrodDesc = '24" Vaulted Drop (12ft+ Ceilings)';
      }

      // CFM target
      const targetCfmMin = Math.round(sqft * 18);
      const targetCfmMax = Math.round(sqft * 26);

      recSpanEl.textContent = spanDesc;
      recDownrodEl.textContent = downrodDesc;
      recCfmEl.textContent = `${targetCfmMin.toLocaleString()} – ${targetCfmMax.toLocaleString()} CFM`;

      this.calcRecommendation = { span, downrod };
    };

    if (lenInput && widthInput && heightInput) {
      lenInput.addEventListener('input', calculate);
      widthInput.addEventListener('input', calculate);
      heightInput.addEventListener('input', calculate);
      calculate();
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (!this.calcRecommendation) return;
        const { span, downrod } = this.calcRecommendation;

        store.setState({ bladeSpan: span, downrodLength: downrod });

        if (this.fanScene) {
          this.fanScene.setBladeSpan(span);
          this.fanScene.setDownrodLength(downrod);
        }

        // Update active UI pills
        const spanContainer = document.getElementById('bladeSpanContainer');
        if (spanContainer) {
          spanContainer.querySelectorAll('.option-pill').forEach((p) => {
            p.classList.toggle('active', parseInt(p.dataset.span, 10) === span);
          });
        }

        const downrodContainer = document.getElementById('downrodContainer');
        if (downrodContainer) {
          downrodContainer.querySelectorAll('.option-pill').forEach((p) => {
            p.classList.toggle('active', parseInt(p.dataset.downrod, 10) === downrod);
          });
        }

        const studioSection = document.getElementById('studio-section');
        if (studioSection) {
          studioSection.scrollIntoView({ behavior: 'smooth' });
        }

        this.showToast(`Applied: ${span}" Airfoil with ${downrod}" Downrod!`, 'success');
      });
    }

    // Room type pills
    const roomTypeContainer = document.getElementById('roomTypeContainer');
    if (roomTypeContainer) {
      roomTypeContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.room-btn');
        if (!btn) return;
        roomTypeContainer.querySelectorAll('.room-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    }
  }

  bindFAQ() {
    const faqAccordion = document.getElementById('faqAccordion');
    if (!faqAccordion) return;

    faqAccordion.addEventListener('click', (e) => {
      const qBtn = e.target.closest('.faq-question');
      if (!qBtn) return;
      const item = qBtn.closest('.faq-item');
      item.classList.toggle('open');
    });
  }

  handleStateChange(state) {
    this.updateUIFromState(state);
  }

  updateUIFromState(state) {
    const model = MODEL_DEFINITIONS[state.activeModelId];
    const color = COLOR_DEFINITIONS[state.selectedColorId];

    // Titles & Names
    const productTitle = document.getElementById('productTitle');
    const selectedColorName = document.getElementById('selectedColorName');
    const finishTypeBadge = document.getElementById('finishTypeBadge');
    const selectedBladeCountLabel = document.getElementById('selectedBladeCountLabel');
    const selectedSpanLabel = document.getElementById('selectedSpanLabel');
    const selectedDownrodLabel = document.getElementById('selectedDownrodLabel');
    const configuredQty = document.getElementById('configuredQty');

    if (productTitle && model) productTitle.textContent = model.name;
    if (selectedColorName && color) selectedColorName.textContent = color.name;
    if (finishTypeBadge && color) finishTypeBadge.textContent = color.finish;

    if (selectedBladeCountLabel) {
      selectedBladeCountLabel.textContent = `${state.bladeCount}-Blade ${state.bladeCount === 3 ? 'Airfoil' : state.bladeCount === 4 ? 'Sculpted' : 'Whisper'}`;
    }

    if (selectedSpanLabel) {
      selectedSpanLabel.textContent = `${state.bladeSpan}" Diameter`;
    }

    if (selectedDownrodLabel) {
      selectedDownrodLabel.textContent = state.downrodLength === 0 ? 'Flush Hugger' : `${state.downrodLength}" Standard Suspension`;
    }

    if (configuredQty) configuredQty.textContent = state.quantity || 1;

    // Pricing
    const unitPrice = store.getCurrentUnitBasePriceUSD();
    const totalPrice = unitPrice * (state.quantity || 1);

    const displayedPrice = document.getElementById('displayedPrice');
    const ctaButtonPrice = document.getElementById('ctaButtonPrice');
    const currSymbol = document.getElementById('currSymbol');

    if (displayedPrice) displayedPrice.textContent = store.formatPrice(unitPrice).replace(/[^0-9]/g, '');
    if (currSymbol) currSymbol.textContent = store.formatPrice(unitPrice).replace(/[0-9.,]/g, '');
    if (ctaButtonPrice) ctaButtonPrice.textContent = store.formatPriceDecimal(totalPrice);

    // Wishlist Heart Icon Sync
    const wishlistHeart = document.getElementById('wishlistHeartIcon');
    const addWishlistBtn = document.getElementById('addWishlistBtn');
    const isWishlisted = store.isInWishlist(state.activeModelId, state.selectedColorId);
    if (addWishlistBtn && wishlistHeart) {
      addWishlistBtn.classList.toggle('active', isWishlisted);
    }

    // Cart Count Badge
    const cartCount = document.getElementById('cartCount');
    const totals = store.getCartTotals();
    if (cartCount) cartCount.textContent = totals.totalCount;

    // Wishlist Count Badge
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) wishlistCount.textContent = state.wishlist.length;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconName = type === 'success' ? 'check-circle' : 'info';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    this.renderIcons();

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.__AURA_APP__ = new App();
});
