import { ProductDetector, ProductInfo, PageContext } from './productDetector';

class ContentScript {
  private detector = new ProductDetector();
  private currentContext: PageContext | null = null;
  private isExtensionEnabled = true;
  private indicatorElements: Map<Element, HTMLElement> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    console.log('🎰 ShopSpin: ContentScript initializing...');
    
    // Check if extension is enabled
    const settings = await chrome.storage.sync.get(['extensionEnabled']);
    this.isExtensionEnabled = settings.extensionEnabled !== false;

    console.log('🎰 ShopSpin: Extension enabled?', this.isExtensionEnabled);

    if (!this.isExtensionEnabled) {
      console.log('🎰 ShopSpin: Extension disabled, exiting init');
      return;
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.extensionEnabled) {
        this.isExtensionEnabled = changes.extensionEnabled.newValue;
        console.log('🎰 ShopSpin: Extension enabled changed to:', this.isExtensionEnabled);
        if (!this.isExtensionEnabled) {
          this.removeAllIndicators();
          this.removeOverlay();
        }
      }
    });

    // Initial detection with delay to ensure page is loaded
    console.log('🎰 ShopSpin: Starting initial detection...');
    setTimeout(() => this.detectAndNotify(), 1000);

    // Listen for DOM changes and navigation
    this.setupObservers();
  }

  private setupObservers() {
    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      const hasSignificantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (hasSignificantChanges) {
        this.debounce(() => this.detectAndNotify(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle navigation changes (SPA routing)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => this.detectAndNotify(), 500);
      }
    }).observe(document, { subtree: true, childList: true });

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      setTimeout(() => this.detectAndNotify(), 500);
    });
  }

  private detectAndNotify() {
    console.log('🎰 ShopSpin: detectAndNotify called, extensionEnabled:', this.isExtensionEnabled);
    
    if (!this.isExtensionEnabled) {
      console.log('🎰 ShopSpin: Extension disabled, returning');
      return;
    }

    try {
      console.log('🎰 ShopSpin: Starting page context detection...');
      const context = this.detector.detectPageContext();
      
      console.log('🎰 ShopSpin: Context detected:', {
        pageType: context.pageType,
        productCount: context.products.length,
        primaryProduct: context.primaryProduct?.name,
        url: window.location.href
      });
      
      if (this.hasContextChanged(context)) {
        console.log('🎰 ShopSpin: Context changed, updating UI');
        this.currentContext = context;
        this.updateUI(context);
        
        if (context.primaryProduct) {
          this.notifyBackground(context.primaryProduct);
        }
      } else {
        console.log('🎰 ShopSpin: No context change detected');
      }
    } catch (error) {
      console.error('🎰 ShopSpin detection error:', error);
      // Don't crash the entire script if detection fails
    }
  }

  private hasContextChanged(newContext: PageContext): boolean {
    if (!this.currentContext) return true;
    
    if (this.currentContext.pageType !== newContext.pageType) return true;
    if (this.currentContext.products.length !== newContext.products.length) return true;
    
    const currentPrimary = this.currentContext.primaryProduct;
    const newPrimary = newContext.primaryProduct;
    
    if (!currentPrimary && !newPrimary) return false;
    if (!currentPrimary || !newPrimary) return true;
    
    return currentPrimary.name !== newPrimary.name || 
           currentPrimary.price !== newPrimary.price;
  }

  private updateUI(context: PageContext) {
    // Clean up existing UI
    this.removeAllIndicators();
    this.removeOverlay();

    console.log('🎰 ShopSpin updateUI:', {
      pageType: context.pageType,
      productCount: context.products.length,
      hasPrimaryProduct: !!context.primaryProduct
    });

    // STRICT: Only show overlay on confirmed single-product pages
    if (context.pageType === 'single-product' && context.primaryProduct) {
      console.log('🎰 ShopSpin: Showing overlay for single product');
      this.showOverlay(context.primaryProduct);
    } 
    // STRICT: Only show subtle floating promotion on multi-product pages (NO individual indicators)
    else if (context.pageType === 'multi-product' && context.products.length > 0) {
      console.log('🎰 ShopSpin: Showing subtle promotion for multi-product page');
      // Only show the floating promotion, no individual product indicators
      setTimeout(() => this.showFloatingPromotion(context.products), 2000);
    }
    // STRICT: Show nothing on unknown page types
    else {
      console.log('🎰 ShopSpin: No UI shown - page type unknown or no products');
    }
  }

  private showFloatingPromotion(products: ProductInfo[]) {
    // Don't show if already exists
    if (document.getElementById('shopspin-floating-promo')) return;

    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const potentialSavings = Math.min(avgPrice * 0.4, 30);

    const floatingPromo = document.createElement('div');
    floatingPromo.id = 'shopspin-floating-promo';
    floatingPromo.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.5s ease;
      border: 2px solid rgba(255,255,255,0.2);
    `;

    floatingPromo.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 24px; margin-right: 8px;">🎰</div>
        <div>
          <div style="font-weight: bold; font-size: 14px;">ShopSpin Extension</div>
          <div style="font-size: 11px; opacity: 0.9;">Win items at fraction of cost!</div>
        </div>
        <button id="shopspin-promo-close" style="margin-left: auto; background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.7; width: 24px; height: 24px;">×</button>
      </div>
      <div style="font-size: 12px; margin-bottom: 8px; opacity: 0.95;">
        💰 Save up to $${potentialSavings.toFixed(0)} on these items
      </div>
      <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 6px; border-radius: 6px; font-size: 11px; font-weight: bold;">
        👆 Click any product to start spinning!
      </div>
    `;

    document.body.appendChild(floatingPromo);

    // Animate in
    setTimeout(() => {
      floatingPromo.style.transform = 'translateY(0)';
      floatingPromo.style.opacity = '1';
    }, 100);

    // Close button handler
    const closeBtn = floatingPromo.querySelector('#shopspin-promo-close');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideFloatingPromotion();
    });

    // Click handler - scroll to first product
    floatingPromo.addEventListener('click', () => {
      if (products[0]?.element) {
        products[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Just hide the promotion, no need to highlight indicators since they don't exist
        this.hideFloatingPromotion();
      }
    });

    // Auto-hide after 8 seconds
    setTimeout(() => {
      this.hideFloatingPromotion();
    }, 8000);
  }

  private hideFloatingPromotion() {
    const promo = document.getElementById('shopspin-floating-promo');
    if (promo) {
      promo.style.transform = 'translateY(100px)';
      promo.style.opacity = '0';
      setTimeout(() => promo.remove(), 500);
    }
  }

  private removeAllIndicators() {
    // Remove all ShopSpin UI elements
    const selectors = [
      '.shopspin-indicator',
      '.shopspin-value-tooltip',
      '.shopspin-urgent-cta',
      '#shopspin-floating-promo',
      '#shopspin-overlay'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });
    
    // Clean up stored indicator references
    this.indicatorElements.clear();
  }

  private notifyBackground(product: ProductInfo) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_FOUND',
      product
    });
  }

  private showOverlay(product: ProductInfo) {
    console.debug('ShopSpin: Showing overlay for product:', product.name);

    // Remove existing overlay
    this.removeOverlay();

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'shopspin-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 2px solid #e5e7eb;
    `;

    // Create shadow DOM for style isolation
    const shadowRoot = overlay.attachShadow({ mode: 'open' });
    
    // Create shadow container
    const shadowContainer = document.createElement('div');
    shadowContainer.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .container { 
          padding: 16px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .title { font-size: 16px; font-weight: bold; }
        .close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
        .product { margin-bottom: 16px; }
        .product-name { font-size: 14px; margin-bottom: 4px; }
        .product-price { font-size: 18px; font-weight: bold; color: #fef08a; }
        .controls { margin-bottom: 16px; }
        .stake-input { 
          width: 100%; 
          padding: 8px; 
          border: none; 
          border-radius: 6px; 
          font-size: 14px;
          margin-bottom: 8px;
        }
        .probability { text-align: center; margin-bottom: 12px; }
        .prob-text { font-size: 12px; opacity: 0.9; }
        .prob-value { font-size: 20px; font-weight: bold; color: #fef08a; }
        .spin-btn { 
          width: 100%; 
          padding: 12px; 
          background: #fef08a; 
          color: #1f2937; 
          border: none; 
          border-radius: 6px; 
          font-size: 16px; 
          font-weight: bold; 
          cursor: pointer;
          transition: all 0.2s;
        }
        .spin-btn:hover { background: #fde047; transform: translateY(-1px); }
        .spin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      </style>
      <div class="container">
        <div class="header">
          <div class="title">🎰 ShopSpin</div>
          <button class="close" id="close-btn">×</button>
        </div>
        <div class="product">
          <div class="product-name">${product.name}</div>
          <div class="product-price">$${product.price.toFixed(2)}</div>
        </div>
        <div class="controls">
          <input type="number" class="stake-input" id="stake-input" 
                 placeholder="Your stake ($)" min="0.01" max="${product.price}" step="0.01">
          <div class="probability">
            <div class="prob-text">Win Probability</div>
            <div class="prob-value" id="probability">0%</div>
          </div>
          <button class="spin-btn" id="spin-btn" disabled>Enter Stake First</button>
        </div>
      </div>
    `;

    shadowRoot.appendChild(shadowContainer);

    // Add event listeners
    const stakeInput = shadowRoot.getElementById('stake-input') as HTMLInputElement;
    const probabilityElement = shadowRoot.getElementById('probability')!;
    const spinBtn = shadowRoot.getElementById('spin-btn') as HTMLButtonElement;
    const closeBtn = shadowRoot.getElementById('close-btn')!;

    stakeInput.addEventListener('input', () => {
      const stake = parseFloat(stakeInput.value) || 0;
      const probability = Math.min((stake / product.price) * 100, 100);
      probabilityElement.textContent = `${probability.toFixed(1)}%`;
      
      spinBtn.disabled = stake <= 0 || stake > product.price;
      spinBtn.textContent = stake > 0 ? '🎲 Spin to Win!' : 'Enter Stake First';
    });

    spinBtn.addEventListener('click', () => {
      const stake = parseFloat(stakeInput.value);
      this.enterSpin(product, stake);
    });

    closeBtn.addEventListener('click', () => {
      this.removeOverlay();
    });

    document.body.appendChild(overlay);
  }

  private removeOverlay() {
    const existing = document.getElementById('shopspin-overlay');
    if (existing) {
      existing.remove();
    }
  }

  private enterSpin(product: ProductInfo, stake: number) {
    chrome.runtime.sendMessage({
      type: 'ENTER_SPIN',
      product,
      stake
    }, (response) => {
      this.handleSpinResult(response);
    });
  }

  private handleSpinResult(result: { won: boolean; message: string }) {
    const overlay = document.getElementById('shopspin-overlay');
    if (!overlay?.shadowRoot) return;

    const container = overlay.shadowRoot.querySelector('.container') as HTMLElement;
    
    if (result.won) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">You Won!</div>
          <div style="font-size: 14px; opacity: 0.9;">${result.message}</div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Better Luck Next Time!</div>
          <div style="font-size: 14px; opacity: 0.9;">${result.message}</div>
        </div>
      `;
    }

    // Auto-close after 3 seconds
    setTimeout(() => this.removeOverlay(), 3000);
  }

  private debounce(func: () => void, wait: number) {
    clearTimeout((this as any).debounceTimer);
    (this as any).debounceTimer = setTimeout(func, wait);
  }
}

// Initialize content script
new ContentScript();