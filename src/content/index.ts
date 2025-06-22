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
    // Check if extension is enabled
    const settings = await chrome.storage.sync.get(['extensionEnabled']);
    this.isExtensionEnabled = settings.extensionEnabled !== false;

    if (!this.isExtensionEnabled) return;

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.extensionEnabled) {
        this.isExtensionEnabled = changes.extensionEnabled.newValue;
        if (!this.isExtensionEnabled) {
          this.removeAllIndicators();
          this.removeOverlay();
        }
      }
    });

    // Initial detection
    this.detectAndNotify();

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
    if (!this.isExtensionEnabled) return;

    try {
      const context = this.detector.detectPageContext();
      
      if (this.hasContextChanged(context)) {
        this.currentContext = context;
        this.updateUI(context);
        
        if (context.primaryProduct) {
          this.notifyBackground(context.primaryProduct);
        }
      }
    } catch (error) {
      console.error('ShopSpin detection error:', error);
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

    console.debug('ShopSpin updateUI:', {
      pageType: context.pageType,
      productCount: context.products.length,
      hasPrimaryProduct: !!context.primaryProduct
    });

    // STRICT: Only show overlay on confirmed single-product pages
    if (context.pageType === 'single-product' && context.primaryProduct) {
      console.debug('ShopSpin: Showing overlay for single product');
      this.showOverlay(context.primaryProduct);
    } 
    // STRICT: Only show indicators on confirmed multi-product pages
    else if (context.pageType === 'multi-product' && context.products.length > 0) {
      console.debug('ShopSpin: Showing indicators for', context.products.length, 'products');
      this.showProductIndicators(context.products);
    }
    // STRICT: Show nothing on unknown page types
    else {
      console.debug('ShopSpin: No UI shown - page type unknown or no products');
    }
  }

  private showProductIndicators(products: ProductInfo[]) {
    // Limit to first 10 products to avoid overwhelming the page
    const limitedProducts = products.slice(0, 10);
    
    for (const product of limitedProducts) {
      if (product.element) {
        this.addProductIndicator(product);
      }
    }
  }

  private addProductIndicator(product: ProductInfo) {
    if (!product.element) return;

    try {
      // Create a subtle, encouraging indicator
      const indicator = document.createElement('div');
      indicator.className = 'shopspin-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 20px;
        background: rgba(102, 126, 234, 0.9);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        opacity: 0.85;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      
      // Create pulsing effect to draw attention subtly
      indicator.innerHTML = '🎲 SPIN';
      indicator.title = `Click to view this item and try ShopSpin! $${product.price.toFixed(2)}`;

      // Enhanced hover effects that encourage clicking through
      indicator.addEventListener('mouseenter', () => {
        indicator.style.transform = 'scale(1.05)';
        indicator.style.opacity = '1';
        indicator.style.background = 'rgba(102, 126, 234, 1)';
        indicator.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        
        // Show encouraging tooltip
        this.showEncouragingTooltip(indicator, product);
      });

      indicator.addEventListener('mouseleave', () => {
        indicator.style.transform = 'scale(1)';
        indicator.style.opacity = '0.85';
        indicator.style.background = 'rgba(102, 126, 234, 0.9)';
        indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        
        this.hideEncouragingTooltip();
      });

      // Instead of showing popup, encourage clicking through to product page
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the product link and encourage user to click it
        if (product.element) {
          const productLink = this.findProductLink(product.element);
          if (productLink) {
            // Add visual feedback
            indicator.style.background = '#10b981';
            indicator.innerHTML = '✨ GO!';
            
            // Highlight the product link briefly
            this.highlightProductLink(productLink);
            
            // Show encouraging message
            this.showClickThroughMessage(indicator, productLink);
            
            setTimeout(() => {
              indicator.style.background = 'rgba(102, 126, 234, 0.9)';
              indicator.innerHTML = '🎲 SPIN';
            }, 2000);
          }
        }
      });

      // Position relative to product element
      try {
        const productStyle = window.getComputedStyle(product.element);
        
        if (productStyle.position === 'static' && product.element instanceof HTMLElement) {
          product.element.style.position = 'relative';
        }

        product.element.appendChild(indicator);
        this.indicatorElements.set(product.element, indicator);
      } catch (styleError) {
        console.debug('ShopSpin styling error:', styleError);
        indicator.style.position = 'fixed';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        document.body.appendChild(indicator);
        this.indicatorElements.set(product.element, indicator);
      }
    } catch (error) {
      console.error('ShopSpin indicator creation error:', error);
    }
  }

  private findProductLink(productElement: Element): HTMLAnchorElement | null {
    // Look for links within the product element
    const links = productElement.querySelectorAll('a[href]');
    
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && (
        href.includes('/dp/') || 
        href.includes('/item/') || 
        href.includes('/product/') || 
        href.includes('/p/') ||
        href.includes('/pd/')
      )) {
        return link as HTMLAnchorElement;
      }
    }
    
    // Fallback: find any link with product-related content
    return productElement.querySelector('a[href*="product"], a[href*="item"], a h1, a h2, a h3') as HTMLAnchorElement;
  }

  private highlightProductLink(link: HTMLAnchorElement) {
    const originalStyle = link.style.cssText;
    
    link.style.cssText += `
      outline: 2px solid #667eea !important;
      outline-offset: 2px !important;
      transition: all 0.3s ease !important;
    `;
    
    setTimeout(() => {
      link.style.cssText = originalStyle;
    }, 2000);
  }

  private showEncouragingTooltip(indicator: HTMLElement, product: ProductInfo) {
    const tooltip = document.createElement('div');
    tooltip.className = 'shopspin-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      bottom: 25px;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10001;
      opacity: 0;
      transform: translateY(5px);
      transition: all 0.2s ease;
    `;
    
    const savings = (product.price * 0.1).toFixed(2); // Example potential savings
    tooltip.textContent = `Click to view item & save up to $${savings}!`;
    
    indicator.appendChild(tooltip);
    
    setTimeout(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    }, 100);
  }

  private hideEncouragingTooltip() {
    const tooltip = document.querySelector('.shopspin-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  private showClickThroughMessage(indicator: HTMLElement, link: HTMLAnchorElement) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: absolute;
      top: -35px;
      right: 0;
      background: #10b981;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 10001;
      font-weight: bold;
    `;
    
    message.textContent = '👆 Click the product to start spinning!';
    indicator.appendChild(message);
    
    // Add a subtle animation to the product link
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
      if (pulseCount < 3) {
        link.style.transform = 'scale(1.02)';
        setTimeout(() => {
          link.style.transform = 'scale(1)';
        }, 200);
        pulseCount++;
      } else {
        clearInterval(pulseInterval);
      }
    }, 400);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  private removeAllIndicators() {
    for (const [, indicator] of this.indicatorElements) {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }
    this.indicatorElements.clear();
  }

  private notifyBackground(product: ProductInfo) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_FOUND',
      product
    });
  }

  private showOverlay(product: ProductInfo) {
    // SAFETY CHECK: Never show overlay if we detect this might be a multi-product page
    const url = window.location.href.toLowerCase();
    const multiProductIndicators = [
      '/search', '/s?', '/s/', 'search=', 'q=', 'query=', '_nkw=', '/results', '/list'
    ];
    
    if (multiProductIndicators.some(indicator => url.includes(indicator))) {
      console.warn('ShopSpin: Blocked overlay on potential multi-product page:', url);
      return;
    }

    // Additional DOM check for multiple products
    const productContainers = document.querySelectorAll(
      '[data-component-type="s-search-result"], .s-result-item, .s-item, [class*="search-result"]'
    );
    
    if (productContainers.length > 2) {
      console.warn('ShopSpin: Blocked overlay - detected', productContainers.length, 'product containers');
      return;
    }

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