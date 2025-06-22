export interface ProductInfo {
  name: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
}

export class ProductDetector {
  detectProduct(): ProductInfo | null {
    // Try JSON-LD structured data first
    const jsonLdProduct = this.detectFromJsonLd();
    if (jsonLdProduct) return jsonLdProduct;

    // Try OpenGraph tags
    const ogProduct = this.detectFromOpenGraph();
    if (ogProduct) return ogProduct;

    // Fallback to text scraping
    const scrapedProduct = this.detectFromTextScraping();
    if (scrapedProduct) return scrapedProduct;

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
    // Look for price patterns
    const priceRegex = /\$([0-9,]+(?:\.[0-9]{2})?)/g;
    const textContent = document.body.innerText || document.body.textContent || '';
    const priceMatches = Array.from(textContent.matchAll(priceRegex));

    if (priceMatches.length === 0) return null;

    // Find the most likely product title (h1, h2, or large text near price)
    let bestTitle = '';
    let bestPrice = 0;

    for (const match of priceMatches) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price < 1 || price > 10000) continue; // Reasonable price range

      // Find nearest heading
      const priceElement = this.findElementContainingText(match[0]);
      if (priceElement) {
        const nearestHeading = this.findNearestHeading(priceElement);
        if (nearestHeading && nearestHeading.textContent) {
          bestTitle = nearestHeading.textContent.trim();
          bestPrice = price;
          break;
        }
      }
    }

    // Fallback to first h1 if no heading found near price
    if (!bestTitle && bestPrice === 0) {
      const firstH1 = document.querySelector('h1');
      if (firstH1 && priceMatches.length > 0) {
        const fallbackPrice = parseFloat(priceMatches[0][1].replace(/,/g, ''));
        if (fallbackPrice >= 1 && fallbackPrice <= 10000) {
          bestTitle = firstH1.textContent?.trim() || '';
          bestPrice = fallbackPrice;
        }
      }
    }

    if (bestTitle && bestPrice > 0) {
      return {
        name: bestTitle,
        price: bestPrice,
        currency: 'USD',
        url: window.location.href
      };
    }

    return null;
  }

  private findElementContainingText(text: string): Element | null {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.includes(text)) {
        return node.parentElement;
      }
    }

    return null;
  }

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