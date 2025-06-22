export interface ProductInfo {
  name: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
}

export class ProductDetector {
  detectProduct(): ProductInfo | null {
    // First check if this looks like a product page
    if (!this.isLikelyProductPage()) {
      return null;
    }

    // Try JSON-LD structured data first
    const jsonLdProduct = this.detectFromJsonLd();
    if (jsonLdProduct && this.validateProduct(jsonLdProduct)) return jsonLdProduct;

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
    
    const priceSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '[data-testid="price-whole"]',
      '.a-price-symbol + .a-price-whole',
      '#price_inside_buybox'
    ];
    
    let price = 0;
    for (const selector of priceSelectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement) {
        const priceText = priceElement.textContent?.replace(/[^0-9.,]/g, '') || '';
        price = parseFloat(priceText.replace(/,/g, ''));
        if (price > 0) break;
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
    const title = document.querySelector('[data-testid="x-item-title-label"], .x-item-title-label')?.textContent?.trim();
    
    const priceSelectors = [
      '[data-testid="notmi-price"] .notranslate',
      '.u-flL .bold',
      '.notranslate[role="text"]'
    ];
    
    let price = 0;
    for (const selector of priceSelectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement) {
        const priceText = priceElement.textContent?.replace(/[^0-9.,]/g, '') || '';
        price = parseFloat(priceText.replace(/,/g, ''));
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
        const priceText = priceElement.textContent?.replace(/[^0-9.,]/g, '') || '';
        price = parseFloat(priceText.replace(/,/g, ''));
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
        
        const priceText = element.textContent.replace(/[^0-9.,]/g, '');
        const parsedPrice = parseFloat(priceText.replace(/,/g, ''));
        
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
    // Enhanced price patterns including different currencies
    const pricePatterns = [
      /\$\s*([0-9,]+(?:\.[0-9]{2})?)/g,           // $123.45
      /USD\s*([0-9,]+(?:\.[0-9]{2})?)/g,          // USD 123.45
      /([0-9,]+(?:\.[0-9]{2})?)\s*USD/g,          // 123.45 USD
      /Price:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi,    // Price: $123.45
      /Cost:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi      // Cost: $123.45
    ];

    let bestPrice = 0;
    let bestPriceElement: Element | null = null;

    // Find the most likely price element
    for (const pattern of pricePatterns) {
      const priceElements = document.querySelectorAll('*');
      
      for (const element of priceElements) {
        if (!element.textContent) continue;
        
        // Skip navigation, footer, and sidebar elements
        const tagName = element.tagName.toLowerCase();
        const className = element.className.toLowerCase();
        
        if (tagName === 'nav' || tagName === 'footer' || 
            className.includes('nav') || className.includes('footer') ||
            className.includes('sidebar') || className.includes('menu')) {
          continue;
        }

        const matches = Array.from(element.textContent.matchAll(pattern));
        
        for (const match of matches) {
          const priceValue = parseFloat(match[1].replace(/,/g, ''));
          
          if (priceValue > 0.01 && priceValue < 50000) {
            // Prioritize elements with price-related classes/ids
            const score = this.calculatePriceElementScore(element);
            
            if (score > 0 && priceValue > bestPrice) {
              bestPrice = priceValue;
              bestPriceElement = element;
            }
          }
        }
      }
      
      if (bestPrice > 0) break;
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