import { ProductDetector } from '../productDetector';

describe('ProductDetector', () => {
  let detector: ProductDetector;

  beforeEach(() => {
    detector = new ProductDetector();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('detectFromJsonLd', () => {
    it('should detect product from JSON-LD structured data', () => {
      const jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.textContent = JSON.stringify({
        '@type': 'Product',
        name: 'Test Product',
        offers: {
          price: '29.99',
          priceCurrency: 'USD'
        },
        image: {
          url: 'https://example.com/image.jpg'
        }
      });
      document.head.appendChild(jsonLdScript);

      const result = detector.detectProduct();

      expect(result).toEqual({
        name: 'Test Product',
        price: 29.99,
        currency: 'USD',
        image: 'https://example.com/image.jpg',
        url: window.location.href
      });
    });

    it('should handle array of offers in JSON-LD', () => {
      const jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.textContent = JSON.stringify({
        '@type': 'Product',
        name: 'Multi-offer Product',
        offers: [
          { price: '19.99', priceCurrency: 'USD' },
          { price: '24.99', priceCurrency: 'USD' }
        ]
      });
      document.head.appendChild(jsonLdScript);

      const result = detector.detectProduct();

      expect(result?.price).toBe(19.99);
      expect(result?.name).toBe('Multi-offer Product');
    });
  });

  describe('detectFromOpenGraph', () => {
    it('should detect product from OpenGraph meta tags', () => {
      const metaPrice = document.createElement('meta');
      metaPrice.setAttribute('property', 'product:price:amount');
      metaPrice.setAttribute('content', '49.99');
      document.head.appendChild(metaPrice);

      const metaCurrency = document.createElement('meta');
      metaCurrency.setAttribute('property', 'product:price:currency');
      metaCurrency.setAttribute('content', 'EUR');
      document.head.appendChild(metaCurrency);

      const metaTitle = document.createElement('meta');
      metaTitle.setAttribute('property', 'og:title');
      metaTitle.setAttribute('content', 'OpenGraph Product');
      document.head.appendChild(metaTitle);

      const result = detector.detectProduct();

      expect(result).toEqual({
        name: 'OpenGraph Product',
        price: 49.99,
        currency: 'EUR',
        image: undefined,
        url: window.location.href
      });
    });
  });

  describe('detectFromTextScraping', () => {
    it('should detect product from text content and headings', () => {
      document.body.innerHTML = `
        <h1>Amazing Widget</h1>
        <div class="price">$39.99</div>
        <p>Product description here</p>
      `;

      const result = detector.detectProduct();

      expect(result?.name).toBe('Amazing Widget');
      expect(result?.price).toBe(39.99);
      expect(result?.currency).toBe('USD');
    });

    it('should handle price with commas', () => {
      document.body.innerHTML = `
        <h1>Expensive Item</h1>
        <span>Price: $1,299.99</span>
      `;

      const result = detector.detectProduct();

      expect(result?.price).toBe(1299.99);
    });

    it('should reject unreasonable prices', () => {
      document.body.innerHTML = `
        <h1>Invalid Product</h1>
        <span>$0.50</span>
        <span>$50000.00</span>
      `;

      const result = detector.detectProduct();

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null when no product is found', () => {
      document.body.innerHTML = `
        <div>No products here</div>
        <p>Just some text content</p>
      `;

      const result = detector.detectProduct();

      expect(result).toBeNull();
    });

    it('should handle malformed JSON-LD gracefully', () => {
      const jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.textContent = '{ invalid json }';
      document.head.appendChild(jsonLdScript);

      const result = detector.detectProduct();

      expect(result).toBeNull();
    });

    it('should prioritize JSON-LD over other methods', () => {
      // Add JSON-LD
      const jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.textContent = JSON.stringify({
        '@type': 'Product',
        name: 'JSON-LD Product',
        offers: { price: '99.99', priceCurrency: 'USD' }
      });
      document.head.appendChild(jsonLdScript);

      // Add OpenGraph (should be ignored)
      const metaPrice = document.createElement('meta');
      metaPrice.setAttribute('property', 'product:price:amount');
      metaPrice.setAttribute('content', '49.99');
      document.head.appendChild(metaPrice);

      const metaTitle = document.createElement('meta');
      metaTitle.setAttribute('property', 'og:title');
      metaTitle.setAttribute('content', 'OpenGraph Product');
      document.head.appendChild(metaTitle);

      const result = detector.detectProduct();

      expect(result?.name).toBe('JSON-LD Product');
      expect(result?.price).toBe(99.99);
    });
  });
});