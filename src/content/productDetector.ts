export interface ProductInfo {
  name: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
  element?: Element; // Reference to the product element on page
}

export interface PageContext {
  pageType: 'single-product' | 'multi-product' | 'unknown';
  products: ProductInfo[];
  primaryProduct?: ProductInfo;
}

export class ProductDetector {
  detectPageContext(): PageContext {
    console.log('🎰 ShopSpin: detectPageContext starting...');
    
    if (!this.isLikelyProductPage()) {
      console.log('🎰 ShopSpin: Not a likely product page');
      return { pageType: 'unknown', products: [] };
    }

    console.log('🎰 ShopSpin: Likely product page detected');
    
    const pageType = this.determinePageType();
    console.log('🎰 ShopSpin: Page type determined:', pageType);
    
    const products = this.detectAllProducts();
    console.log('🎰 ShopSpin: Products detected:', products.length);
    
    const primaryProduct = this.selectPrimaryProduct(products, pageType);
    console.log('🎰 ShopSpin: Primary product:', primaryProduct?.name || 'none');

    return {
      pageType,
      products,
      primaryProduct
    };
  }

  // Legacy method for backward compatibility
  detectProduct(): ProductInfo | null {
    const context = this.detectPageContext();
    return context.primaryProduct || null;
  }

  private determinePageType(): 'single-product' | 'multi-product' | 'unknown' {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // Single product page indicators (very specific)
    const singleProductIndicators = [
      '/dp/', '/gp/product/', '/item/', '/p/', '/pd/', '/product/',
      'product-detail', 'item-detail', '/products/', '/buy/'
    ];

    // Multi-product page indicators (search, category, listing pages)
    const multiProductIndicators = [
      '/search', '/s?', '/s/', '/browse/', '/category/', '/c/', '/shop/',
      'search=', 'category=', '/results', '/list', '/catalog', '/find',
      'q=', 'query=', '_nkw=', '_sacat=', '_cat=', '/bestsellers', '/gp/bestsellers',
      '/best-sellers', '/top-rated', '/most-popular', '/trending'
    ];

    // FIRST: Check for explicit multi-product indicators
    if (multiProductIndicators.some(indicator => 
        url.includes(indicator) || pathname.includes(indicator))) {
      console.debug('ShopSpin: Multi-product page detected via URL:', url);
      return 'multi-product';
    }

    // SECOND: Check for explicit single-product indicators
    if (singleProductIndicators.some(indicator => 
        url.includes(indicator) || pathname.includes(indicator))) {
      console.debug('ShopSpin: Single-product page detected via URL:', url);
      return 'single-product';
    }

    // THIRD: Check DOM for multiple product containers
    const productContainers = document.querySelectorAll(
      '[data-component-type="s-search-result"], .s-result-item, .product-item, .item-container, [class*="product-card"], .s-item, [class*="search-result"]'
    );

    if (productContainers.length > 2) {
      console.debug('ShopSpin: Multi-product page detected via DOM:', productContainers.length, 'containers');
      return 'multi-product';
    }

    // FOURTH: Look for single product page indicators in DOM
    const singleProductElements = document.querySelectorAll(
      '#productTitle, [data-testid="title"], .product-title, .product__title, .x-item-title-label'
    );

    if (singleProductElements.length > 0) {
      console.debug('ShopSpin: Single-product page detected via DOM elements');
      return 'single-product';
    }

    // FIFTH: Check page structure for lists vs single items
    const listIndicators = document.querySelectorAll(
      'ul[class*="search"], ol[class*="search"], [class*="search-results"], [class*="product-list"], [class*="items-list"]'
    );

    if (listIndicators.length > 0) {
      console.debug('ShopSpin: Multi-product page detected via list structure');
      return 'multi-product';
    }

    // DEFAULT: If unclear, be conservative and return unknown
    console.debug('ShopSpin: Page type unknown, URL:', url);
    return 'unknown';
  }

  private detectAllProducts(): ProductInfo[] {
    const products: ProductInfo[] = [];
    console.debug('ShopSpin: Starting detectAllProducts...');
    
    const pageType = this.determinePageType();

    // STRATEGY 1: For single-product pages, prioritize single-product detection methods
    if (pageType === 'single-product') {
      console.debug('ShopSpin: Using single-product detection strategy...');
      
      // Try JSON-LD first (most reliable for single products)
      const jsonLdProduct = this.detectFromJsonLd();
      if (jsonLdProduct && this.validateProduct(jsonLdProduct)) {
        console.debug('ShopSpin: Found JSON-LD product:', jsonLdProduct.name);
        products.push(jsonLdProduct);
        return products; // Return immediately for single products
      }

      // Try the original single product detection methods
      const singleProduct = this.detectSingleProduct();
      if (singleProduct) {
        console.debug('ShopSpin: Single product found:', singleProduct.name);
        products.push(singleProduct);
        return products;
      }
    }

    // STRATEGY 2: For multi-product pages, use multi-product detection
    else if (pageType === 'multi-product') {
      console.debug('ShopSpin: Using multi-product detection strategy...');
      
      // Try JSON-LD first (might catch featured product)
      const jsonLdProduct = this.detectFromJsonLd();
      if (jsonLdProduct && this.validateProduct(jsonLdProduct)) {
        console.debug('ShopSpin: Found JSON-LD product:', jsonLdProduct.name);
        products.push(jsonLdProduct);
      }

      // Try site-specific multi-product detection
      const siteProducts = this.detectMultipleSiteSpecificProducts();
      console.debug('ShopSpin: Site-specific products found:', siteProducts.length);
      for (const product of siteProducts) {
        if (this.validateProduct(product)) {
          products.push(product);
          console.debug('ShopSpin: Valid site product added:', product.name);
        } else {
          console.debug('ShopSpin: Invalid site product skipped:', product.name);
        }
      }
    }

    // STRATEGY 3: For unknown pages, try both approaches
    else {
      console.debug('ShopSpin: Using fallback detection strategy...');
      
      // Try JSON-LD first
      const jsonLdProduct = this.detectFromJsonLd();
      if (jsonLdProduct && this.validateProduct(jsonLdProduct)) {
        console.debug('ShopSpin: Found JSON-LD product:', jsonLdProduct.name);
        products.push(jsonLdProduct);
      }

      // Try single product detection
      const singleProduct = this.detectSingleProduct();
      if (singleProduct && this.validateProduct(singleProduct)) {
        console.debug('ShopSpin: Single product found:', singleProduct.name);
        products.push(singleProduct);
      }

      // If still no products, try multi-product detection
      if (products.length === 0) {
        const siteProducts = this.detectMultipleSiteSpecificProducts();
        for (const product of siteProducts) {
          if (this.validateProduct(product)) {
            products.push(product);
          }
        }
      }
    }

    console.debug('ShopSpin: Final product count:', products.length);
    return products;
  }

  private detectSingleProduct(): ProductInfo | null {
    // Try site-specific selectors
    const siteSpecificProduct = this.detectFromSiteSpecificSelectors();
    if (siteSpecificProduct && this.validateProduct(siteSpecificProduct)) return siteSpecificProduct;

    // Try OpenGraph tags
    const ogProduct = this.detectFromOpenGraph();
    if (ogProduct && this.validateProduct(ogProduct)) return ogProduct;

    // Fallback to enhanced text scraping
    const scrapedProduct = this.detectFromTextScraping();
    if (scrapedProduct && this.validateProduct(scrapedProduct)) return scrapedProduct;

    return null;
  }

  private selectPrimaryProduct(products: ProductInfo[], pageType: string): ProductInfo | undefined {
    if (products.length === 0) return undefined;
    if (products.length === 1) return products[0];

    // For single-product pages, prefer the first valid product
    if (pageType === 'single-product') {
      return products[0];
    }

    // For multi-product pages, we might want to let the user choose
    // For now, return the first one but we'll handle this in the UI layer
    return products[0];
  }

  private detectMultipleSiteSpecificProducts(): ProductInfo[] {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('amazon.')) {
      return this.detectAmazonProducts();
    }
    
    if (hostname.includes('ebay.')) {
      return this.detectEbayProducts();
    }
    
    return this.detectGenericProducts();
  }

  private detectAmazonProducts(): ProductInfo[] {
    const products: ProductInfo[] = [];
    console.log('🎰 ShopSpin: Detecting Amazon products...');
    
    // Search result items
    const searchResults = document.querySelectorAll('[data-component-type="s-search-result"]');
    console.log('🎰 ShopSpin: Found search result containers:', searchResults.length);
    
    for (const result of searchResults) {
      const titleElement = result.querySelector('h2 a span, [data-cy="title-recipe-link"]');
      const priceElement = result.querySelector('.a-price-whole, .a-price .a-offscreen');
      
      if (titleElement?.textContent && priceElement?.textContent) {
        const title = titleElement.textContent.trim();
        const price = this.extractExactPrice(priceElement.textContent);
        
        if (price > 0) {
          products.push({
            name: title,
            price,
            currency: 'USD',
            url: window.location.href,
            element: result as Element
          });
        }
      }
    }
    
    // Best Sellers and other listing pages
    if (products.length === 0) {
      console.log('🎰 ShopSpin: No search results, trying best sellers/listing selectors...');
      const listingItems = document.querySelectorAll([
        '.p13n-sc-uncoverable-faceout',  // Best sellers items
        '.a-carousel-card',              // Carousel items
        '[data-testid="product-card"]',  // Product cards
        '.s-result-item',                // Alternative search results
        '.p13n-asin',                    // Best sellers ASINs
        '[data-asin]'                    // Any element with ASIN
      ].join(', '));
      
      console.log('🎰 ShopSpin: Found listing items:', listingItems.length);
      
      // Debug: Show what these elements actually are
      if (listingItems.length > 0) {
        console.log('🎰 ShopSpin: First item sample:', {
          tagName: listingItems[0].tagName,
          className: listingItems[0].className,
          innerHTML: listingItems[0].innerHTML.slice(0, 200)
        });
      }
      
      for (const [index, item] of listingItems.entries()) {
        if (index < 5) { // Only debug first 5 items to avoid spam
          console.log('🎰 ShopSpin: Processing item', index, 'classes:', item.className);
        }
        
        // Try multiple title selectors for different layouts
        const titleSelectors = [
          'h3 a span', 'h2 a span', 'h4 a span',
          '.p13n-sc-truncate', 
          '[data-testid="title"]',
          '.a-link-normal span',
          'a[href*="/dp/"]',
          '.s-link-style span',
          'h3', 'h2', 'h4', // Try direct headings
          '.a-link-normal', // Try the link itself
          'a' // Try any link
        ];
        
        let titleElement = null;
        let usedTitleSelector = '';
        for (const selector of titleSelectors) {
          titleElement = item.querySelector(selector);
          if (titleElement?.textContent?.trim()) {
            usedTitleSelector = selector;
            break;
          }
        }
        
        // Try multiple price selectors
        const priceSelectors = [
          '.a-price .a-offscreen',
          '.a-price-whole',
          '.p13n-sc-price',
          '[data-testid="price"]',
          '.a-link-normal .a-price',
          '.s-price',
          '.a-price', // Try just price class
          '[class*="price"]' // Try any element with price in class
        ];
        
        let priceElement = null;
        let usedPriceSelector = '';
        for (const selector of priceSelectors) {
          priceElement = item.querySelector(selector);
          if (priceElement?.textContent?.includes('$')) {
            usedPriceSelector = selector;
            break;
          }
        }
        
        if (index < 5) { // Debug first 5 items
          console.log('🎰 ShopSpin: Item', index, 'title found?', !!titleElement, 'selector:', usedTitleSelector);
          console.log('🎰 ShopSpin: Item', index, 'price found?', !!priceElement, 'selector:', usedPriceSelector);
          if (titleElement) console.log('🎰 ShopSpin: Item', index, 'title text:', titleElement.textContent?.slice(0, 50));
          if (priceElement) console.log('🎰 ShopSpin: Item', index, 'price text:', priceElement.textContent?.slice(0, 20));
        }
        
        if (titleElement?.textContent && priceElement?.textContent) {
          const title = titleElement.textContent.trim();
          const price = this.extractExactPrice(priceElement.textContent);
          
          if (price > 0 && title.length > 3) {
            console.log('🎰 ShopSpin: Found listing product:', title, '$' + price);
            products.push({
              name: title,
              price,
              currency: 'USD',
              url: window.location.href,
              element: item as Element
            });
          }
        }
      }
    }
    
    console.log('🎰 ShopSpin: Amazon products found:', products.length);
    return products;
  }

  private detectEbayProducts(): ProductInfo[] {
    const products: ProductInfo[] = [];
    
    try {
      // Search result items - try multiple selectors
      const searchResults = document.querySelectorAll('.s-item:not(.s-item--ad), .srp-results .s-item, [data-viewport]');
      
      for (const result of searchResults) {
        try {
          // Try multiple title selectors
          const titleSelectors = [
            '.s-item__title', 
            '.s-item__title-text', 
            'h3.s-item__title',
            '.it-ttl',
            '[data-testid="item-title"]'
          ];
          
          let titleElement = null;
          for (const selector of titleSelectors) {
            titleElement = result.querySelector(selector);
            if (titleElement?.textContent?.trim()) break;
          }
          
          // Try multiple price selectors
          const priceSelectors = [
            '.s-item__price .notranslate',
            '.s-item__price',
            '.it-prc',
            '[data-testid="item-price"]',
            '.u-flL .bold'
          ];
          
          let priceElement = null;
          for (const selector of priceSelectors) {
            priceElement = result.querySelector(selector);
            if (priceElement?.textContent?.includes('$')) break;
          }
          
          if (titleElement?.textContent && priceElement?.textContent) {
            const title = titleElement.textContent.trim();
            
            // Clean title - remove "New Listing" and other prefixes
            const cleanTitle = title.replace(/^(New Listing|SPONSORED)\s*/i, '').trim();
            
            if (cleanTitle.length < 3) continue;
            
            const price = this.extractExactPrice(priceElement.textContent);
            
            if (price > 0 && price < 50000) {
              products.push({
                name: cleanTitle,
                price,
                currency: 'USD',
                url: window.location.href,
                element: result as Element
              });
            }
          }
        } catch (error) {
          // Skip this item if there's an error parsing it
          console.debug('eBay product parsing error:', error);
          continue;
        }
      }
    } catch (error) {
      console.error('eBay products detection error:', error);
    }
    
    return products;
  }

  private detectGenericProducts(): ProductInfo[] {
    const products: ProductInfo[] = [];
    
    // Look for common product container patterns
    const productContainers = document.querySelectorAll(
      '.product-item, .product-card, .item-container, [class*="product-"], [data-testid*="product"]'
    );
    
    for (const container of productContainers) {
      const titleElement = container.querySelector('h1, h2, h3, .title, .name, [class*="title"], [class*="name"]');
      const priceElement = container.querySelector('[class*="price"], .cost, .amount, [data-testid*="price"]');
      
      if (titleElement?.textContent && priceElement?.textContent) {
        const title = titleElement.textContent.trim();
        const price = this.extractExactPrice(priceElement.textContent);
        
        if (price > 0 && title.length >= 3) {
          products.push({
            name: title,
            price,
            currency: 'USD',
            url: window.location.href,
            element: container as Element
          });
        }
      }
    }
    
    return products;
  }

  private isLikelyProductPage(): boolean {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Check for common product page indicators
    const productIndicators = [
      '/product/', '/item/', '/p/', '/dp/', '/pd/', '/products/',
      'product-', 'item-', '/buy/', '/shop/', '/store/'
    ];
    
    const hasProductIndicator = productIndicators.some(indicator => 
      url.includes(indicator) || pathname.includes(indicator)
    );

    // Check for e-commerce sites
    const ecommerceDomains = [
      'amazon.', 'ebay.', 'etsy.', 'shopify', 'walmart.', 'target.',
      'bestbuy.', 'homedepot.', 'lowes.', 'costco.', 'wayfair.',
      'overstock.', 'newegg.', 'alibaba.', 'aliexpress.'
    ];
    
    const isEcommerceSite = ecommerceDomains.some(domain => 
      window.location.hostname.includes(domain)
    );

    // Check for product-related elements on page
    const hasProductElements = !!(
      document.querySelector('[data-testid*="price"], [class*="price"], [id*="price"]') ||
      document.querySelector('[data-testid*="product"], [class*="product"], [id*="product"]') ||
      document.querySelector('button[class*="cart"], button[class*="buy"], button[id*="buy"]') ||
      document.querySelector('[class*="add-to-cart"], [id*="add-to-cart"]')
    );

    return hasProductIndicator || isEcommerceSite || hasProductElements;
  }

  private validateProduct(product: ProductInfo): boolean {
    // Validate product name
    if (!product.name || product.name.length < 3 || product.name.length > 200) {
      return false;
    }

    // Validate price
    if (!product.price || product.price < 0.01 || product.price > 50000) {
      return false;
    }

    // Check for spam/generic indicators
    const spamIndicators = [
      'lorem ipsum', 'test product', 'sample', 'placeholder',
      'example', 'demo', '404', 'error', 'not found'
    ];
    
    const nameWords = product.name.toLowerCase();
    if (spamIndicators.some(spam => nameWords.includes(spam))) {
      return false;
    }

    return true;
  }

  private detectFromSiteSpecificSelectors(): ProductInfo | null {
    const hostname = window.location.hostname.toLowerCase();
    
    // Amazon
    if (hostname.includes('amazon.')) {
      return this.detectAmazonProduct();
    }
    
    // eBay
    if (hostname.includes('ebay.')) {
      return this.detectEbayProduct();
    }
    
    // Shopify stores
    if (hostname.includes('shopify') || document.querySelector('meta[name="shopify-digital-wallet"]')) {
      return this.detectShopifyProduct();
    }
    
    // Generic e-commerce patterns
    return this.detectGenericEcommerceProduct();
  }

  private detectAmazonProduct(): ProductInfo | null {
    const title = document.querySelector('#productTitle, [data-testid="title"]')?.textContent?.trim();
    
    // More comprehensive price extraction with exact cents
    const priceSelectors = [
      // Full price with cents
      '.a-price .a-offscreen',
      '.a-price-whole + .a-price-fraction',
      
      // Structured price elements
      {
        whole: '.a-price-whole',
        fraction: '.a-price-fraction'
      },
      
      // Alternative selectors
      '[data-testid="price-whole"]',
      '#price_inside_buybox .a-offscreen',
      '.a-price-range .a-offscreen',
      
      // Fallback selectors
      '.a-price-symbol + .a-price-whole',
      '#price_inside_buybox'
    ];
    
    let price = 0;
    let bestScore = 0;
    
    for (const selector of priceSelectors) {
      if (typeof selector === 'object' && selector.whole) {
        // Handle structured price (whole + fraction)
        const wholeElement = document.querySelector(selector.whole);
        const fractionElement = document.querySelector(selector.fraction);
        
        if (wholeElement?.textContent) {
          const wholePart = wholeElement.textContent.replace(/[^0-9]/g, '');
          const fractionPart = fractionElement?.textContent?.replace(/[^0-9]/g, '') || '00';
          
          if (wholePart) {
            const candidatePrice = parseFloat(`${wholePart}.${fractionPart.padEnd(2, '0').substring(0, 2)}`);
            
            if (candidatePrice > 0) {
              const visualScore = this.calculateVisualPriorityScore(wholeElement);
              
              if (visualScore > bestScore || (price === 0 && candidatePrice > 0)) {
                price = candidatePrice;
                bestScore = visualScore;
              }
            }
          }
        }
      } else {
        // Handle single element selectors - check all matches, not just first
        const priceElements = document.querySelectorAll(selector as string);
        
        for (const priceElement of priceElements) {
          if (priceElement?.textContent) {
            // Enhanced price extraction for exact cents
            const candidatePrice = this.extractExactPrice(priceElement.textContent);
            
            if (candidatePrice > 0) {
              const visualScore = this.calculateVisualPriorityScore(priceElement);
              
              if (visualScore > bestScore || (price === 0 && candidatePrice > 0)) {
                price = candidatePrice;
                bestScore = visualScore;
              }
            }
          }
        }
      }
    }
    
    const image = document.querySelector('#landingImage, [data-testid="hero-image"]')?.getAttribute('src') || undefined;
    
    if (title && price > 0) {
      return {
        name: title,
        price,
        currency: 'USD',
        image,
        url: window.location.href
      };
    }
    
    return null;
  }

  private detectEbayProduct(): ProductInfo | null {
    // Multiple title selectors for eBay product pages
    const titleSelectors = [
      '[data-testid="x-item-title-label"]',
      '.x-item-title-label',
      '#x-item-title-text',
      '.it-ttl',
      'h1[itemprop="name"]'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        title = element.textContent.trim();
        break;
      }
    }
    
    // Comprehensive price selectors for exact pricing
    const priceSelectors = [
      // Current price selectors
      '[data-testid="notmi-price"] .notranslate',
      '.u-flL .bold',
      '.notranslate[role="text"]',
      
      // Alternative price selectors
      '#prcIsum',
      '.u-flL.condText',
      '[itemprop="price"]',
      '.ux-textspans--BOLD',
      
      // Structured price detection
      '.ux-textspans[content]'
    ];
    
    let price = 0;
    let bestScore = 0;
    
    for (const selector of priceSelectors) {
      const priceElements = document.querySelectorAll(selector);
      
      for (const priceElement of priceElements) {
        if (priceElement?.textContent) {
          let candidatePrice = 0;
          
          // First try to get exact price from content attribute
          const contentPrice = priceElement.getAttribute('content');
          if (contentPrice) {
            const parsedContent = parseFloat(contentPrice);
            if (parsedContent > 0) {
              candidatePrice = parsedContent;
            }
          }
          
          // Otherwise parse from text content with exact extraction
          if (candidatePrice === 0) {
            candidatePrice = this.extractExactPrice(priceElement.textContent);
          }
          
          if (candidatePrice > 0) {
            const visualScore = this.calculateVisualPriorityScore(priceElement);
            
            if (visualScore > bestScore || (price === 0 && candidatePrice > 0)) {
              price = candidatePrice;
              bestScore = visualScore;
            }
          }
        }
      }
    }
    
    const image = document.querySelector('#icImg, .ux-image-carousel img')?.getAttribute('src');
    
    if (title && price > 0) {
      return {
        name: title,
        price,
        currency: 'USD',
        image: image || undefined,
        url: window.location.href
      };
    }
    
    return null;
  }

  private detectShopifyProduct(): ProductInfo | null {
    const title = document.querySelector('.product-title, .product__title, [class*="product-title"]')?.textContent?.trim();
    
    const priceSelectors = [
      '.price, .product-price, .money, .product__price',
      '[class*="price"]:not([class*="compare"]):not([class*="original"])',
      '[data-testid*="price"]'
    ];
    
    let price = 0;
    for (const selector of priceSelectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement && !priceElement.classList.contains('compare-price')) {
        price = this.extractExactPrice(priceElement.textContent || '');
        if (price > 0) break;
      }
    }
    
    if (title && price > 0) {
      return {
        name: title,
        price,
        currency: 'USD',
        url: window.location.href
      };
    }
    
    return null;
  }

  private detectGenericEcommerceProduct(): ProductInfo | null {
    // Try common product title selectors
    const titleSelectors = [
      'h1[class*="product"]', 'h1[class*="title"]', 'h1[data-testid*="title"]',
      '.product-name', '.product-title', '.item-title', '.product__title',
      '[data-testid*="product-title"]', '[data-testid*="product-name"]'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        title = element.textContent.trim();
        break;
      }
    }
    
    // Try common price selectors
    const priceSelectors = [
      '[class*="price"]:not([class*="compare"]):not([class*="original"]):not([class*="msrp"])',
      '[data-testid*="price"]', '[data-price]', '[id*="price"]',
      '.cost', '.amount', '.value', '.money'
    ];
    
    let price = 0;
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (!element.textContent) continue;
        
        // Skip elements that are likely not the main price
        const className = element.className.toLowerCase();
        if (className.includes('compare') || className.includes('original') || 
            className.includes('msrp') || className.includes('strike')) {
          continue;
        }
        
        const parsedPrice = this.extractExactPrice(element.textContent);
        
        if (parsedPrice > 0 && parsedPrice < 50000) {
          price = parsedPrice;
          break;
        }
      }
      if (price > 0) break;
    }
    
    if (title && price > 0) {
      return {
        name: title,
        price,
        currency: 'USD',
        url: window.location.href
      };
    }
    
    return null;
  }

  private detectFromJsonLd(): ProductInfo | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        const product = this.findProductInJsonLd(data);
        if (product) return product;
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  private findProductInJsonLd(data: any): ProductInfo | null {
    if (Array.isArray(data)) {
      for (const item of data) {
        const product = this.findProductInJsonLd(item);
        if (product) return product;
      }
      return null;
    }

    if (data['@type'] === 'Product' || data.type === 'Product') {
      const offers = data.offers || data.Offers;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      
      if (offer && offer.price) {
        return {
          name: data.name || data.title || '',
          price: parseFloat(offer.price),
          currency: offer.priceCurrency || 'USD',
          image: data.image?.[0]?.url || data.image?.url || data.image || undefined,
          url: window.location.href
        };
      }
    }

    // Recursively search in nested objects
    for (const key in data) {
      if (typeof data[key] === 'object' && data[key] !== null) {
        const product = this.findProductInJsonLd(data[key]);
        if (product) return product;
      }
    }

    return null;
  }

  private detectFromOpenGraph(): ProductInfo | null {
    const priceElement = document.querySelector('meta[property="product:price:amount"]');
    const currencyElement = document.querySelector('meta[property="product:price:currency"]');
    const titleElement = document.querySelector('meta[property="og:title"]');
    const imageElement = document.querySelector('meta[property="og:image"]');

    if (priceElement && titleElement) {
      const price = parseFloat(priceElement.getAttribute('content') || '');
      if (!isNaN(price)) {
        return {
          name: titleElement.getAttribute('content') || '',
          price,
          currency: currencyElement?.getAttribute('content') || 'USD',
          image: imageElement?.getAttribute('content') || undefined,
          url: window.location.href
        };
      }
    }

    return null;
  }

  private detectFromTextScraping(): ProductInfo | null {
    // Enhanced price patterns for exact cent detection
    const pricePatterns = [
      /\$\s*([0-9,]+\.[0-9]{2})/g,               // $123.45 (exact cents)
      /\$\s*([0-9,]+)/g,                         // $123 (whole dollars)
      /USD\s*([0-9,]+(?:\.[0-9]{2})?)/g,         // USD 123.45
      /([0-9,]+(?:\.[0-9]{2})?)\s*USD/g,         // 123.45 USD
      /Price:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi,   // Price: $123.45
      /Cost:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi,    // Cost: $123.45
      /\$([0-9,]+(?:\.[0-9]{2})?)\s*(?:each|ea)/gi // $123.45 each
    ];

    let bestPrice = 0;
    let bestPriceElement: Element | null = null;
    let bestScore = 0;

    // Target price-specific elements first for better accuracy
    const priceSpecificSelectors = [
      '[class*="price"]:not([class*="compare"]):not([class*="original"])',
      '[data-testid*="price"]',
      '[itemprop="price"]',
      '.cost', '.amount', '.value', '.money',
      '[id*="price"]'
    ];

    // First pass: check price-specific elements with visual prioritization
    for (const selector of priceSpecificSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (!element.textContent) continue;
        
        // Use enhanced price extraction
        const priceValue = this.extractExactPrice(element.textContent);
        
        if (priceValue > 0.01 && priceValue < 50000) {
          const baseScore = this.calculatePriceElementScore(element);
          const visualScore = this.calculateVisualPriorityScore(element);
          const totalScore = baseScore + visualScore;
          
          if (totalScore > bestScore || (totalScore > 0 && priceValue > bestPrice)) {
            bestPrice = priceValue;
            bestPriceElement = element;
            bestScore = totalScore;
          }
        }
      }
    }

    // Second pass: broader search if no price found
    if (bestPrice === 0) {
      const allElements = document.querySelectorAll('*:not(nav):not(footer):not(script):not(style)');
      
      for (const element of allElements) {
        if (!element.textContent) continue;
        
        const tagName = element.tagName.toLowerCase();
        const className = element.className.toLowerCase();
        
        // Skip non-content elements
        if (tagName === 'nav' || tagName === 'footer' || 
            className.includes('nav') || className.includes('footer') ||
            className.includes('sidebar') || className.includes('menu') ||
            className.includes('breadcrumb')) {
          continue;
        }

        for (const pattern of pricePatterns) {
          const matches = Array.from(element.textContent.matchAll(pattern));
          
          for (const match of matches) {
            const priceValue = this.extractExactPrice(match[1]);
            
            if (priceValue > 0.01 && priceValue < 50000) {
              const baseScore = this.calculatePriceElementScore(element);
              const visualScore = this.calculateVisualPriorityScore(element);
              const totalScore = baseScore + visualScore;
              
              if (totalScore > bestScore) {
                bestPrice = priceValue;
                bestPriceElement = element;
                bestScore = totalScore;
              }
            }
          }
        }
      }
    }

    if (!bestPriceElement || bestPrice === 0) return null;

    // Find the most likely product title
    const title = this.findProductTitle(bestPriceElement);
    
    if (title && title.length >= 3) {
      return {
        name: title,
        price: bestPrice,
        currency: 'USD',
        url: window.location.href
      };
    }

    return null;
  }

  private calculatePriceElementScore(element: Element): number {
    let score = 0;
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    // const textContent = element.textContent?.toLowerCase() || '';

    // Positive indicators
    if (className.includes('price')) score += 10;
    if (className.includes('cost')) score += 8;
    if (className.includes('amount')) score += 6;
    if (className.includes('value')) score += 4;
    if (id.includes('price')) score += 10;
    if (id.includes('cost')) score += 8;

    // Negative indicators (likely not main price)
    if (className.includes('compare') || className.includes('original') ||
        className.includes('msrp') || className.includes('strike') ||
        className.includes('discount') || className.includes('save')) {
      score -= 15;
    }

    // Element position/size hints
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      score += 2; // Visible element
    }

    return score;
  }

  private calculateVisualPriorityScore(element: Element): number {
    let score = 0;
    
    try {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // PRIORITY 1: Is element currently visible in viewport?
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= viewportHeight &&
        rect.right <= viewportWidth
      );
      
      if (isInViewport) {
        score += 50; // High priority for visible elements
        
        // BONUS: Elements in upper portion of viewport get extra points
        const topPortionBonus = Math.max(0, 20 - (rect.top / viewportHeight) * 20);
        score += topPortionBonus;
      }
      
      // PRIORITY 2: Vertical position (higher = better score)
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      // Calculate position from top as percentage
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;
      const positionPercent = elementTop / documentHeight;
      
      // Top 25% of page gets maximum points, then decreases
      if (positionPercent < 0.25) {
        score += 30; // Top quarter
      } else if (positionPercent < 0.5) {
        score += 20; // Second quarter
      } else if (positionPercent < 0.75) {
        score += 10; // Third quarter
      }
      // Bottom quarter gets no bonus (may be related products)
      
      // PRIORITY 3: Size and prominence
      const elementArea = rect.width * rect.height;
      if (elementArea > 1000) {
        score += 5; // Larger elements likely more important
      }
      
      // PRIORITY 4: Exclude likely related/recommended sections
      const element_parent = element.closest('[class*="recommend"], [class*="related"], [class*="similar"], [class*="also"], [class*="suggestion"], [id*="recommend"], [id*="related"]');
      if (element_parent) {
        score -= 25; // Penalize elements in related product sections
      }
      
      // PRIORITY 5: Boost main content areas
      const mainContent = element.closest('main, [role="main"], #main, .main, #content, .content, [class*="product-detail"], [class*="item-detail"]');
      if (mainContent) {
        score += 15; // Boost elements in main content areas
      }
      
      // PRIORITY 6: Penalize footer/bottom sections  
      const footerElement = element.closest('footer, [class*="footer"], [id*="footer"]');
      if (footerElement) {
        score -= 20; // Penalize footer elements
      }
      
    } catch (error) {
      // If any error in calculation, return neutral score
      console.debug('Visual priority calculation error:', error);
      return 0;
    }
    
    return Math.max(0, score); // Ensure non-negative score
  }

  private extractExactPrice(text: string): number {
    if (!text) return 0;
    
    // Comprehensive price patterns prioritizing exact cents
    const pricePatterns = [
      // PRIORITY 1: Exact prices with cents (most preferred)
      /\$\s*([0-9,]+\.[0-9]{2})\b/g,                    // $123.45
      /USD\s*\$?\s*([0-9,]+\.[0-9]{2})\b/g,             // USD $123.45 or USD 123.45
      /([0-9,]+\.[0-9]{2})\s*USD\b/g,                   // 123.45 USD
      /Price[:\s]*\$?\s*([0-9,]+\.[0-9]{2})\b/gi,       // Price: $123.45
      /Cost[:\s]*\$?\s*([0-9,]+\.[0-9]{2})\b/gi,        // Cost: $123.45
      
      // PRIORITY 2: Prices with one decimal (convert to .X0)
      /\$\s*([0-9,]+\.[0-9]{1})\b/g,                    // $123.4 → $123.40
      
      // PRIORITY 3: Whole dollar amounts (convert to .00)
      /\$\s*([0-9,]+)\b/g,                              // $123 → $123.00
      /USD\s*\$?\s*([0-9,]+)\b/g,                       // USD 123 → $123.00
      /([0-9,]+)\s*USD\b/g,                             // 123 USD → $123.00
      /Price[:\s]*\$?\s*([0-9,]+)\b/gi,                 // Price: 123 → $123.00
      /Cost[:\s]*\$?\s*([0-9,]+)\b/gi,                  // Cost: 123 → $123.00
    ];
    
    for (const pattern of pricePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const cleanPrice = match[1].replace(/,/g, ''); // Remove commas
        let price = parseFloat(cleanPrice);
        
        if (isNaN(price) || price <= 0) continue;
        
        // Handle different decimal cases
        if (cleanPrice.includes('.')) {
          const decimalParts = cleanPrice.split('.');
          const cents = decimalParts[1];
          
          if (cents.length === 1) {
            // Convert single decimal to two (e.g., 123.4 → 123.40)
            price = parseFloat(`${decimalParts[0]}.${cents}0`);
          } else if (cents.length === 2) {
            // Already has exact cents
            price = parseFloat(cleanPrice);
          }
        } else {
          // Whole dollar amount - ensure .00
          price = parseFloat(`${cleanPrice}.00`);
        }
        
        // Validate reasonable price range
        if (price >= 0.01 && price <= 50000) {
          return price;
        }
      }
    }
    
    return 0; // No valid price found
  }

  private findProductTitle(priceElement: Element): string {
    // Look for title in order of preference
    
    // 1. Check for h1 elements (most likely product title)
    const h1Elements = document.querySelectorAll('h1');
    for (const h1 of h1Elements) {
      const title = h1.textContent?.trim();
      if (title && title.length >= 3 && title.length <= 200) {
        // Skip if it looks like a site title or category
        if (!title.toLowerCase().includes('home') && 
            !title.toLowerCase().includes('category') &&
            !title.toLowerCase().includes('shop')) {
          return title;
        }
      }
    }

    // 2. Look for elements with product-related classes near the price
    const productSelectors = [
      '[class*="product-title"]', '[class*="product-name"]', '[class*="item-title"]',
      '[class*="title"]', '[data-testid*="title"]', '[data-testid*="name"]'
    ];

    for (const selector of productSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const title = element.textContent?.trim();
        if (title && title.length >= 3 && title.length <= 200) {
          // Check if this element is reasonably close to the price element
          if (this.areElementsRelated(element, priceElement)) {
            return title;
          }
        }
      }
    }

    // 3. Fallback to nearest heading
    const nearestHeading = this.findNearestHeading(priceElement);
    if (nearestHeading?.textContent) {
      const title = nearestHeading.textContent.trim();
      if (title.length >= 3 && title.length <= 200) {
        return title;
      }
    }

    return '';
  }

  private areElementsRelated(element1: Element, element2: Element): boolean {
    // Check if elements are in the same container or nearby
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();

    // Check if they're vertically close (within 200px)
    const verticalDistance = Math.abs(rect1.top - rect2.top);
    if (verticalDistance < 200) return true;

    // Check if they share a common parent within 3 levels
    let parent1 = element1.parentElement;
    let parent2 = element2.parentElement;
    
    for (let i = 0; i < 3; i++) {
      if (parent1 === parent2) return true;
      if (parent1) parent1 = parent1.parentElement;
      if (parent2) parent2 = parent2.parentElement;
    }

    return false;
  }

  // Removed unused method findElementContainingText

  private findNearestHeading(element: Element): Element | null {
    // Look for headings in the same container or nearby
    let current = element;
    
    for (let i = 0; i < 5; i++) {
      const heading = current.querySelector('h1, h2, h3') || 
                     current.previousElementSibling?.querySelector('h1, h2, h3') ||
                     current.nextElementSibling?.querySelector('h1, h2, h3');
      
      if (heading) return heading;
      
      current = current.parentElement || current;
      if (!current || current === document.body) break;
    }

    return null;
  }
}