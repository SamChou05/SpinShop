import { ProductDetector, ProductInfo } from './productDetector';

class ContentScript {
  private detector = new ProductDetector();
  private currentProduct: ProductInfo | null = null;
  private isExtensionEnabled = true;

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

    const product = this.detector.detectProduct();
    
    if (product && (!this.currentProduct || 
        this.currentProduct.name !== product.name || 
        this.currentProduct.price !== product.price)) {
      
      this.currentProduct = product;
      this.notifyBackground(product);
      this.showOverlay(product);
    } else if (!product && this.currentProduct) {
      this.currentProduct = null;
      this.removeOverlay();
    }
  }

  private notifyBackground(product: ProductInfo) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_FOUND',
      product
    });
  }

  private showOverlay(product: ProductInfo) {
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

  private debounce(func: Function, wait: number) {
    clearTimeout((this as any).debounceTimer);
    (this as any).debounceTimer = setTimeout(func, wait);
  }
}

// Initialize content script
new ContentScript();