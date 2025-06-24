var v=Object.defineProperty;var w=(f,e,t)=>e in f?v(f,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):f[e]=t;var y=(f,e,t)=>w(f,typeof e!="symbol"?e+"":e,t);class P{detectPageContext(){if(console.log("🎰 ShopSpin: detectPageContext starting..."),!this.isLikelyProductPage())return console.log("🎰 ShopSpin: Not a likely product page"),{pageType:"unknown",products:[]};console.log("🎰 ShopSpin: Likely product page detected");const e=this.determinePageType();console.log("🎰 ShopSpin: Page type determined:",e);const t=this.detectAllProducts();console.log("🎰 ShopSpin: Products detected:",t.length);const o=this.selectPrimaryProduct(t,e);return console.log("🎰 ShopSpin: Primary product:",(o==null?void 0:o.name)||"none"),{pageType:e,products:t,primaryProduct:o}}detectProduct(){return this.detectPageContext().primaryProduct||null}determinePageType(){const e=window.location.href.toLowerCase(),t=window.location.pathname.toLowerCase(),o=["/dp/","/gp/product/","/item/","/p/","/pd/","/product/","product-detail","item-detail","/products/","/buy/"];if(["/search","/s?","/s/","/browse/","/category/","/c/","/shop/","search=","category=","/results","/list","/catalog","/find","q=","query=","_nkw=","_sacat=","_cat=","/bestsellers","/gp/bestsellers","/best-sellers","/top-rated","/most-popular","/trending"].some(c=>e.includes(c)||t.includes(c)))return console.debug("ShopSpin: Multi-product page detected via URL:",e),"multi-product";if(o.some(c=>e.includes(c)||t.includes(c)))return console.debug("ShopSpin: Single-product page detected via URL:",e),"single-product";const r=document.querySelectorAll('[data-component-type="s-search-result"], .s-result-item, .product-item, .item-container, [class*="product-card"], .s-item, [class*="search-result"]');return r.length>2?(console.debug("ShopSpin: Multi-product page detected via DOM:",r.length,"containers"),"multi-product"):document.querySelectorAll('#productTitle, [data-testid="title"], .product-title, .product__title, .x-item-title-label').length>0?(console.debug("ShopSpin: Single-product page detected via DOM elements"),"single-product"):document.querySelectorAll('ul[class*="search"], ol[class*="search"], [class*="search-results"], [class*="product-list"], [class*="items-list"]').length>0?(console.debug("ShopSpin: Multi-product page detected via list structure"),"multi-product"):(console.debug("ShopSpin: Page type unknown, URL:",e),"unknown")}detectAllProducts(){const e=[];console.debug("ShopSpin: Starting detectAllProducts...");const t=this.determinePageType();if(t==="single-product"){console.debug("ShopSpin: Using single-product detection strategy...");const o=this.detectFromJsonLd();if(o&&this.validateProduct(o))return console.debug("ShopSpin: Found JSON-LD product:",o.name),e.push(o),e;const n=this.detectSingleProduct();if(n)return console.debug("ShopSpin: Single product found:",n.name),e.push(n),e}else if(t==="multi-product"){console.debug("ShopSpin: Using multi-product detection strategy...");const o=this.detectFromJsonLd();o&&this.validateProduct(o)&&(console.debug("ShopSpin: Found JSON-LD product:",o.name),e.push(o));const n=this.detectMultipleSiteSpecificProducts();console.debug("ShopSpin: Site-specific products found:",n.length);for(const r of n)this.validateProduct(r)?(e.push(r),console.debug("ShopSpin: Valid site product added:",r.name)):console.debug("ShopSpin: Invalid site product skipped:",r.name)}else{console.debug("ShopSpin: Using fallback detection strategy...");const o=this.detectFromJsonLd();o&&this.validateProduct(o)&&(console.debug("ShopSpin: Found JSON-LD product:",o.name),e.push(o));const n=this.detectSingleProduct();if(n&&this.validateProduct(n)&&(console.debug("ShopSpin: Single product found:",n.name),e.push(n)),e.length===0){const r=this.detectMultipleSiteSpecificProducts();for(const s of r)this.validateProduct(s)&&e.push(s)}}return console.debug("ShopSpin: Final product count:",e.length),e}detectSingleProduct(){const e=this.detectFromSiteSpecificSelectors();if(e&&this.validateProduct(e))return e;const t=this.detectFromOpenGraph();if(t&&this.validateProduct(t))return t;const o=this.detectFromTextScraping();return o&&this.validateProduct(o)?o:null}selectPrimaryProduct(e,t){if(e.length!==0)return e.length===1||t==="single-product",e[0]}detectMultipleSiteSpecificProducts(){const e=window.location.hostname.toLowerCase();return e.includes("amazon.")?this.detectAmazonProducts():e.includes("ebay.")?this.detectEbayProducts():this.detectGenericProducts()}detectAmazonProducts(){var o,n,r,s;const e=[];console.log("🎰 ShopSpin: Detecting Amazon products...");const t=document.querySelectorAll('[data-component-type="s-search-result"]');console.log("🎰 ShopSpin: Found search result containers:",t.length);for(const i of t){const c=i.querySelector('h2 a span, [data-cy="title-recipe-link"]'),l=i.querySelector(".a-price-whole, .a-price .a-offscreen");if(c!=null&&c.textContent&&(l!=null&&l.textContent)){const d=c.textContent.trim(),a=this.extractExactPrice(l.textContent);a>0&&e.push({name:d,price:a,currency:"USD",url:window.location.href,element:i})}}if(e.length===0){console.log("🎰 ShopSpin: No search results, trying best sellers/listing selectors...");const i=document.querySelectorAll([".p13n-sc-uncoverable-faceout",".a-carousel-card",'[data-testid="product-card"]',".s-result-item",".p13n-asin","[data-asin]"].join(", "));console.log("🎰 ShopSpin: Found listing items:",i.length),i.length>0&&console.log("🎰 ShopSpin: First item sample:",{tagName:i[0].tagName,className:i[0].className,innerHTML:i[0].innerHTML.slice(0,200)});for(const[c,l]of i.entries()){c<5&&console.log("🎰 ShopSpin: Processing item",c,"classes:",l.className);const d=["h3 a span","h2 a span","h4 a span",".p13n-sc-truncate",'[data-testid="title"]',".a-link-normal span",'a[href*="/dp/"]',".s-link-style span","h3","h2","h4",".a-link-normal","a"];let a=null,p="";for(const h of d)if(a=l.querySelector(h),(o=a==null?void 0:a.textContent)!=null&&o.trim()){p=h;break}const m=[".a-price .a-offscreen",".a-price-whole",".p13n-sc-price",'[data-testid="price"]',".a-link-normal .a-price",".s-price",".a-price",'[class*="price"]'];let u=null,g="";for(const h of m)if(u=l.querySelector(h),(n=u==null?void 0:u.textContent)!=null&&n.includes("$")){g=h;break}if(c<5&&(console.log("🎰 ShopSpin: Item",c,"title found?",!!a,"selector:",p),console.log("🎰 ShopSpin: Item",c,"price found?",!!u,"selector:",g),a&&console.log("🎰 ShopSpin: Item",c,"title text:",(r=a.textContent)==null?void 0:r.slice(0,50)),u&&console.log("🎰 ShopSpin: Item",c,"price text:",(s=u.textContent)==null?void 0:s.slice(0,20))),a!=null&&a.textContent&&(u!=null&&u.textContent)){const h=a.textContent.trim(),b=this.extractExactPrice(u.textContent);b>0&&h.length>3&&(console.log("🎰 ShopSpin: Found listing product:",h,"$"+b),e.push({name:h,price:b,currency:"USD",url:window.location.href,element:l}))}}}return console.log("🎰 ShopSpin: Amazon products found:",e.length),e}detectEbayProducts(){var t,o;const e=[];try{const n=document.querySelectorAll(".s-item:not(.s-item--ad), .srp-results .s-item, [data-viewport]");for(const r of n)try{const s=[".s-item__title",".s-item__title-text","h3.s-item__title",".it-ttl",'[data-testid="item-title"]'];let i=null;for(const d of s)if(i=r.querySelector(d),(t=i==null?void 0:i.textContent)!=null&&t.trim())break;const c=[".s-item__price .notranslate",".s-item__price",".it-prc",'[data-testid="item-price"]',".u-flL .bold"];let l=null;for(const d of c)if(l=r.querySelector(d),(o=l==null?void 0:l.textContent)!=null&&o.includes("$"))break;if(i!=null&&i.textContent&&(l!=null&&l.textContent)){const a=i.textContent.trim().replace(/^(New Listing|SPONSORED)\s*/i,"").trim();if(a.length<3)continue;const p=this.extractExactPrice(l.textContent);p>0&&p<5e4&&e.push({name:a,price:p,currency:"USD",url:window.location.href,element:r})}}catch(s){console.debug("eBay product parsing error:",s);continue}}catch(n){console.error("eBay products detection error:",n)}return e}detectGenericProducts(){const e=[],t=document.querySelectorAll('.product-item, .product-card, .item-container, [class*="product-"], [data-testid*="product"]');for(const o of t){const n=o.querySelector('h1, h2, h3, .title, .name, [class*="title"], [class*="name"]'),r=o.querySelector('[class*="price"], .cost, .amount, [data-testid*="price"]');if(n!=null&&n.textContent&&(r!=null&&r.textContent)){const s=n.textContent.trim(),i=this.extractExactPrice(r.textContent);i>0&&s.length>=3&&e.push({name:s,price:i,currency:"USD",url:window.location.href,element:o})}}return e}isLikelyProductPage(){const e=window.location.href.toLowerCase(),t=window.location.pathname.toLowerCase(),n=["/product/","/item/","/p/","/dp/","/pd/","/products/","product-","item-","/buy/","/shop/","/store/"].some(c=>e.includes(c)||t.includes(c)),s=["amazon.","ebay.","etsy.","shopify","walmart.","target.","bestbuy.","homedepot.","lowes.","costco.","wayfair.","overstock.","newegg.","alibaba.","aliexpress."].some(c=>window.location.hostname.includes(c)),i=!!(document.querySelector('[data-testid*="price"], [class*="price"], [id*="price"]')||document.querySelector('[data-testid*="product"], [class*="product"], [id*="product"]')||document.querySelector('button[class*="cart"], button[class*="buy"], button[id*="buy"]')||document.querySelector('[class*="add-to-cart"], [id*="add-to-cart"]'));return n||s||i}validateProduct(e){if(!e.name||e.name.length<3||e.name.length>200||!e.price||e.price<.01||e.price>5e4)return!1;const t=["lorem ipsum","test product","sample","placeholder","example","demo","404","error","not found"],o=e.name.toLowerCase();return!t.some(n=>o.includes(n))}detectFromSiteSpecificSelectors(){const e=window.location.hostname.toLowerCase();return e.includes("amazon.")?this.detectAmazonProduct():e.includes("ebay.")?this.detectEbayProduct():e.includes("shopify")||document.querySelector('meta[name="shopify-digital-wallet"]')?this.detectShopifyProduct():this.detectGenericEcommerceProduct()}detectAmazonProduct(){var s,i,c,l;const e=(i=(s=document.querySelector('#productTitle, [data-testid="title"]'))==null?void 0:s.textContent)==null?void 0:i.trim(),t=[".a-price .a-offscreen",".a-price-whole + .a-price-fraction",{whole:".a-price-whole",fraction:".a-price-fraction"},'[data-testid="price-whole"]',"#price_inside_buybox .a-offscreen",".a-price-range .a-offscreen",".a-price-symbol + .a-price-whole","#price_inside_buybox"];let o=0,n=0;for(const d of t)if(typeof d=="object"&&d.whole){const a=document.querySelector(d.whole),p=document.querySelector(d.fraction);if(a!=null&&a.textContent){const m=a.textContent.replace(/[^0-9]/g,""),u=((c=p==null?void 0:p.textContent)==null?void 0:c.replace(/[^0-9]/g,""))||"00";if(m){const g=parseFloat(`${m}.${u.padEnd(2,"0").substring(0,2)}`);if(g>0){const h=this.calculateVisualPriorityScore(a);(h>n||o===0&&g>0)&&(o=g,n=h)}}}}else{const a=document.querySelectorAll(d);for(const p of a)if(p!=null&&p.textContent){const m=this.extractExactPrice(p.textContent);if(m>0){const u=this.calculateVisualPriorityScore(p);(u>n||o===0&&m>0)&&(o=m,n=u)}}}const r=((l=document.querySelector('#landingImage, [data-testid="hero-image"]'))==null?void 0:l.getAttribute("src"))||void 0;return e&&o>0?{name:e,price:o,currency:"USD",image:r,url:window.location.href}:null}detectEbayProduct(){var i,c;const e=['[data-testid="x-item-title-label"]',".x-item-title-label","#x-item-title-text",".it-ttl",'h1[itemprop="name"]'];let t="";for(const l of e){const d=document.querySelector(l);if((i=d==null?void 0:d.textContent)!=null&&i.trim()){t=d.textContent.trim();break}}const o=['[data-testid="notmi-price"] .notranslate',".u-flL .bold",'.notranslate[role="text"]',"#prcIsum",".u-flL.condText",'[itemprop="price"]',".ux-textspans--BOLD",".ux-textspans[content]"];let n=0,r=0;for(const l of o){const d=document.querySelectorAll(l);for(const a of d)if(a!=null&&a.textContent){let p=0;const m=a.getAttribute("content");if(m){const u=parseFloat(m);u>0&&(p=u)}if(p===0&&(p=this.extractExactPrice(a.textContent)),p>0){const u=this.calculateVisualPriorityScore(a);(u>r||n===0&&p>0)&&(n=p,r=u)}}}const s=(c=document.querySelector("#icImg, .ux-image-carousel img"))==null?void 0:c.getAttribute("src");return t&&n>0?{name:t,price:n,currency:"USD",image:s||void 0,url:window.location.href}:null}detectShopifyProduct(){var n,r;const e=(r=(n=document.querySelector('.product-title, .product__title, [class*="product-title"]'))==null?void 0:n.textContent)==null?void 0:r.trim(),t=[".price, .product-price, .money, .product__price",'[class*="price"]:not([class*="compare"]):not([class*="original"])','[data-testid*="price"]'];let o=0;for(const s of t){const i=document.querySelector(s);if(i&&!i.classList.contains("compare-price")&&(o=this.extractExactPrice(i.textContent||""),o>0))break}return e&&o>0?{name:e,price:o,currency:"USD",url:window.location.href}:null}detectGenericEcommerceProduct(){var r,s;const e=['h1[class*="product"]','h1[class*="title"]','h1[data-testid*="title"]',".product-name",".product-title",".item-title",".product__title",'[data-testid*="product-title"]','[data-testid*="product-name"]'];let t="";for(const i of e){const c=document.querySelector(i);if((r=c==null?void 0:c.textContent)!=null&&r.trim()){t=c.textContent.trim();break}}const o=['[class*="price"]:not([class*="compare"]):not([class*="original"]):not([class*="msrp"])','[data-testid*="price"]',"[data-price]",'[id*="price"]',".cost",".amount",".value",".money"];let n=0;for(const i of o){const c=document.querySelectorAll(i);for(const l of c){if(!l.textContent)continue;const d=((s=l.className)==null?void 0:s.toLowerCase())||"";if(d.includes("compare")||d.includes("original")||d.includes("msrp")||d.includes("strike"))continue;const a=this.extractExactPrice(l.textContent);if(a>0&&a<5e4){n=a;break}}if(n>0)break}return t&&n>0?{name:t,price:n,currency:"USD",url:window.location.href}:null}detectFromJsonLd(){const e=document.querySelectorAll('script[type="application/ld+json"]');for(const t of e)try{const o=JSON.parse(t.textContent||""),n=this.findProductInJsonLd(o);if(n)return n}catch{continue}return null}findProductInJsonLd(e){var t,o,n;if(Array.isArray(e)){for(const r of e){const s=this.findProductInJsonLd(r);if(s)return s}return null}if(e["@type"]==="Product"||e.type==="Product"){const r=e.offers||e.Offers,s=Array.isArray(r)?r[0]:r;if(s&&s.price)return{name:e.name||e.title||"",price:parseFloat(s.price),currency:s.priceCurrency||"USD",image:((o=(t=e.image)==null?void 0:t[0])==null?void 0:o.url)||((n=e.image)==null?void 0:n.url)||e.image||void 0,url:window.location.href}}for(const r in e)if(typeof e[r]=="object"&&e[r]!==null){const s=this.findProductInJsonLd(e[r]);if(s)return s}return null}detectFromOpenGraph(){const e=document.querySelector('meta[property="product:price:amount"]'),t=document.querySelector('meta[property="product:price:currency"]'),o=document.querySelector('meta[property="og:title"]'),n=document.querySelector('meta[property="og:image"]');if(e&&o){const r=parseFloat(e.getAttribute("content")||"");if(!isNaN(r))return{name:o.getAttribute("content")||"",price:r,currency:(t==null?void 0:t.getAttribute("content"))||"USD",image:(n==null?void 0:n.getAttribute("content"))||void 0,url:window.location.href}}return null}detectFromTextScraping(){var i;const e=[/\$\s*([0-9,]+\.[0-9]{2})/g,/\$\s*([0-9,]+)/g,/USD\s*([0-9,]+(?:\.[0-9]{2})?)/g,/([0-9,]+(?:\.[0-9]{2})?)\s*USD/g,/Price:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi,/Cost:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi,/\$([0-9,]+(?:\.[0-9]{2})?)\s*(?:each|ea)/gi];let t=0,o=null,n=0;const r=['[class*="price"]:not([class*="compare"]):not([class*="original"])','[data-testid*="price"]','[itemprop="price"]',".cost",".amount",".value",".money",'[id*="price"]'];for(const c of r){const l=document.querySelectorAll(c);for(const d of l){if(!d.textContent)continue;const a=this.extractExactPrice(d.textContent);if(a>.01&&a<5e4){const p=this.calculatePriceElementScore(d),m=this.calculateVisualPriorityScore(d),u=p+m;(u>n||u>0&&a>t)&&(t=a,o=d,n=u)}}}if(t===0){const c=document.querySelectorAll("*:not(nav):not(footer):not(script):not(style)");for(const l of c){if(!l.textContent)continue;const d=l.tagName.toLowerCase(),a=((i=l.className)==null?void 0:i.toLowerCase())||"";if(!(d==="nav"||d==="footer"||a.includes("nav")||a.includes("footer")||a.includes("sidebar")||a.includes("menu")||a.includes("breadcrumb")))for(const p of e){const m=Array.from(l.textContent.matchAll(p));for(const u of m){const g=this.extractExactPrice(u[1]);if(g>.01&&g<5e4){const h=this.calculatePriceElementScore(l),b=this.calculateVisualPriorityScore(l),x=h+b;x>n&&(t=g,o=l,n=x)}}}}}if(!o||t===0)return null;const s=this.findProductTitle(o);return s&&s.length>=3?{name:s,price:t,currency:"USD",url:window.location.href}:null}calculatePriceElementScore(e){var s,i;let t=0;const o=((s=e.className)==null?void 0:s.toLowerCase())||"",n=((i=e.id)==null?void 0:i.toLowerCase())||"";o.includes("price")&&(t+=10),o.includes("cost")&&(t+=8),o.includes("amount")&&(t+=6),o.includes("value")&&(t+=4),n.includes("price")&&(t+=10),n.includes("cost")&&(t+=8),(o.includes("compare")||o.includes("original")||o.includes("msrp")||o.includes("strike")||o.includes("discount")||o.includes("save"))&&(t-=15);const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(t+=2),t}calculateVisualPriorityScore(e){let t=0;try{const o=e.getBoundingClientRect(),n=window.innerHeight,r=window.innerWidth;if(o.top>=0&&o.left>=0&&o.bottom<=n&&o.right<=r){t+=50;const g=Math.max(0,20-o.top/n*20);t+=g}const i=Math.max(document.body.scrollHeight,document.body.offsetHeight,document.documentElement.clientHeight,document.documentElement.scrollHeight,document.documentElement.offsetHeight),c=window.pageYOffset||document.documentElement.scrollTop,d=(o.top+c)/i;d<.25?t+=30:d<.5?t+=20:d<.75&&(t+=10),o.width*o.height>1e3&&(t+=5),e.closest('[class*="recommend"], [class*="related"], [class*="similar"], [class*="also"], [class*="suggestion"], [id*="recommend"], [id*="related"]')&&(t-=25),e.closest('main, [role="main"], #main, .main, #content, .content, [class*="product-detail"], [class*="item-detail"]')&&(t+=15),e.closest('footer, [class*="footer"], [id*="footer"]')&&(t-=20)}catch(o){return console.debug("Visual priority calculation error:",o),0}return Math.max(0,t)}extractExactPrice(e){if(!e)return 0;const t=[/\$\s*([0-9,]+\.[0-9]{2})\b/g,/USD\s*\$?\s*([0-9,]+\.[0-9]{2})\b/g,/([0-9,]+\.[0-9]{2})\s*USD\b/g,/Price[:\s]*\$?\s*([0-9,]+\.[0-9]{2})\b/gi,/Cost[:\s]*\$?\s*([0-9,]+\.[0-9]{2})\b/gi,/\$\s*([0-9,]+\.[0-9]{1})\b/g,/\$\s*([0-9,]+)\b/g,/USD\s*\$?\s*([0-9,]+)\b/g,/([0-9,]+)\s*USD\b/g,/Price[:\s]*\$?\s*([0-9,]+)\b/gi,/Cost[:\s]*\$?\s*([0-9,]+)\b/gi];for(const o of t){const n=Array.from(e.matchAll(o));for(const r of n){const s=r[1].replace(/,/g,"");let i=parseFloat(s);if(!(isNaN(i)||i<=0)){if(s.includes(".")){const c=s.split("."),l=c[1];l.length===1?i=parseFloat(`${c[0]}.${l}0`):l.length===2&&(i=parseFloat(s))}else i=parseFloat(`${s}.00`);if(i>=.01&&i<=5e4)return i}}}return 0}findProductTitle(e){var r,s;const t=document.querySelectorAll("h1");for(const i of t){const c=(r=i.textContent)==null?void 0:r.trim();if(c&&c.length>=3&&c.length<=200&&!c.toLowerCase().includes("home")&&!c.toLowerCase().includes("category")&&!c.toLowerCase().includes("shop"))return c}const o=['[class*="product-title"]','[class*="product-name"]','[class*="item-title"]','[class*="title"]','[data-testid*="title"]','[data-testid*="name"]'];for(const i of o){const c=document.querySelectorAll(i);for(const l of c){const d=(s=l.textContent)==null?void 0:s.trim();if(d&&d.length>=3&&d.length<=200&&this.areElementsRelated(l,e))return d}}const n=this.findNearestHeading(e);if(n!=null&&n.textContent){const i=n.textContent.trim();if(i.length>=3&&i.length<=200)return i}return""}areElementsRelated(e,t){const o=e.getBoundingClientRect(),n=t.getBoundingClientRect();if(Math.abs(o.top-n.top)<200)return!0;let s=e.parentElement,i=t.parentElement;for(let c=0;c<3;c++){if(s===i)return!0;s&&(s=s.parentElement),i&&(i=i.parentElement)}return!1}findNearestHeading(e){var o,n;let t=e;for(let r=0;r<5;r++){const s=t.querySelector("h1, h2, h3")||((o=t.previousElementSibling)==null?void 0:o.querySelector("h1, h2, h3"))||((n=t.nextElementSibling)==null?void 0:n.querySelector("h1, h2, h3"));if(s)return s;if(t=t.parentElement||t,!t||t===document.body)break}return null}}class S{constructor(e,t){y(this,"currentProduct");y(this,"currentStake");this.currentProduct=e,this.currentStake=t}show(){const e=document.createElement("div");e.id="shopspin-user-registration",e.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;const t=document.createElement("div");t.style.cssText=`
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `,t.innerHTML=`
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h2 style="margin: 0; color: #1f2937;">Congratulations! You Won!</h2>
        <p style="margin: 10px 0 0 0; color: #6b7280;">Please provide your shipping information to claim your prize</p>
      </div>

      <form id="user-registration-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Full Name *</label>
          <input type="text" id="name" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Email Address *</label>
          <input type="email" id="email" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Street Address *</label>
          <input type="text" id="street" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">City *</label>
            <input type="text" id="city" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">State *</label>
            <input type="text" id="state" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">ZIP Code *</label>
            <input type="text" id="zipCode" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Country *</label>
            <input type="text" id="country" value="United States" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
          </div>
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Phone Number</label>
          <input type="tel" id="phone" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
        </div>

        <div style="margin-top: 10px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280;">
            <input type="checkbox" id="consent" required style="transform: scale(1.2);">
            I consent to receiving communications about my prize and future ShopSpin offers
          </label>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" id="cancel-btn" style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Cancel
          </button>
          <button type="submit" id="submit-btn" style="flex: 2; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
            Claim My Prize!
          </button>
        </div>
      </form>

      <div id="loading" style="display: none; text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
        <div>Processing your information...</div>
      </div>

      <div id="success" style="display: none; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h3 style="margin: 0 0 10px 0; color: #059669;">Prize Claimed Successfully!</h3>
        <p style="margin: 0; color: #6b7280;">We'll contact you soon about shipping details.</p>
      </div>

      <div id="error" style="display: none; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <h3 style="margin: 0 0 10px 0; color: #dc2626;">Error</h3>
        <p id="error-message" style="margin: 0; color: #6b7280;"></p>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Try Again
        </button>
      </div>
    `,e.appendChild(t),document.body.appendChild(e),this.setupEventListeners()}setupEventListeners(){const e=document.getElementById("user-registration-form"),t=document.getElementById("cancel-btn");document.getElementById("submit-btn"),t.addEventListener("click",()=>{this.hide()}),e.addEventListener("submit",async o=>{o.preventDefault(),await this.handleSubmit()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&this.hide()})}async handleSubmit(){const e=document.getElementById("user-registration-form"),t=document.getElementById("loading"),o=document.getElementById("success"),n=document.getElementById("error"),r=document.getElementById("error-message");e.style.display="none",t.style.display="block";try{const s={name:document.getElementById("name").value.trim(),email:document.getElementById("email").value.trim(),address:{street:document.getElementById("street").value.trim(),city:document.getElementById("city").value.trim(),state:document.getElementById("state").value.trim(),zipCode:document.getElementById("zipCode").value.trim(),country:document.getElementById("country").value.trim()},phone:document.getElementById("phone").value.trim()||void 0},i=await new Promise(c=>{chrome.runtime.sendMessage({type:"COMPLETE_WIN",product:this.currentProduct,stake:this.currentStake,userInfo:s},c)});t.style.display="none",i.won?(o.style.display="block",setTimeout(()=>this.hide(),3e3)):(n.style.display="block",r.textContent=i.message||"Unknown error occurred")}catch{t.style.display="none",n.style.display="block",r.textContent="Network error. Please check your connection and try again."}}hide(){const e=document.getElementById("shopspin-user-registration");e&&e.remove()}}class C{constructor(){y(this,"detector",new P);y(this,"currentContext",null);y(this,"isExtensionEnabled",!0);y(this,"indicatorElements",new Map);this.init()}async init(){console.log("🎰 ShopSpin: ContentScript initializing...");const e=await chrome.storage.sync.get(["extensionEnabled"]);if(this.isExtensionEnabled=e.extensionEnabled!==!1,console.log("🎰 ShopSpin: Extension enabled?",this.isExtensionEnabled),!this.isExtensionEnabled){console.log("🎰 ShopSpin: Extension disabled, exiting init");return}chrome.storage.onChanged.addListener(t=>{t.extensionEnabled&&(this.isExtensionEnabled=t.extensionEnabled.newValue,console.log("🎰 ShopSpin: Extension enabled changed to:",this.isExtensionEnabled),this.isExtensionEnabled||(this.removeAllIndicators(),this.removeOverlay()))}),console.log("🎰 ShopSpin: Starting initial detection..."),setTimeout(()=>this.detectAndNotify(),1e3),this.setupObservers()}setupObservers(){new MutationObserver(o=>{o.some(r=>r.type==="childList"&&r.addedNodes.length>0)&&this.debounce(()=>this.detectAndNotify(),1e3)}).observe(document.body,{childList:!0,subtree:!0});let t=location.href;new MutationObserver(()=>{const o=location.href;o!==t&&(t=o,setTimeout(()=>this.detectAndNotify(),500))}).observe(document,{subtree:!0,childList:!0}),window.addEventListener("popstate",()=>{setTimeout(()=>this.detectAndNotify(),500)})}detectAndNotify(){var e;if(console.log("🎰 ShopSpin: detectAndNotify called, extensionEnabled:",this.isExtensionEnabled),!this.isExtensionEnabled){console.log("🎰 ShopSpin: Extension disabled, returning");return}try{console.log("🎰 ShopSpin: Starting page context detection...");const t=this.detector.detectPageContext();console.log("🎰 ShopSpin: Context detected:",{pageType:t.pageType,productCount:t.products.length,primaryProduct:(e=t.primaryProduct)==null?void 0:e.name,url:window.location.href}),this.hasContextChanged(t)?(console.log("🎰 ShopSpin: Context changed, updating UI"),this.currentContext=t,this.updateUI(t),t.primaryProduct&&this.notifyBackground(t.primaryProduct)):console.log("🎰 ShopSpin: No context change detected")}catch(t){console.error("🎰 ShopSpin detection error:",t)}}hasContextChanged(e){if(!this.currentContext||this.currentContext.pageType!==e.pageType||this.currentContext.products.length!==e.products.length)return!0;const t=this.currentContext.primaryProduct,o=e.primaryProduct;return!t&&!o?!1:!t||!o?!0:t.name!==o.name||t.price!==o.price}updateUI(e){this.removeAllIndicators(),this.removeOverlay(),console.log("🎰 ShopSpin updateUI:",{pageType:e.pageType,productCount:e.products.length,hasPrimaryProduct:!!e.primaryProduct}),e.pageType==="single-product"&&e.primaryProduct?(console.log("🎰 ShopSpin: Showing overlay for single product"),this.showOverlay(e.primaryProduct)):e.pageType==="multi-product"&&e.products.length>0?(console.log("🎰 ShopSpin: Showing subtle promotion for multi-product page"),setTimeout(()=>this.showFloatingPromotion(e.products),2e3)):console.log("🎰 ShopSpin: No UI shown - page type unknown or no products")}showFloatingPromotion(e){if(document.getElementById("shopspin-floating-promo"))return;const t=e.reduce((s,i)=>s+i.price,0)/e.length,o=Math.min(t*.4,30),n=document.createElement("div");n.id="shopspin-floating-promo",n.style.cssText=`
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
    `,n.innerHTML=`
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 24px; margin-right: 8px;">🎰</div>
        <div>
          <div style="font-weight: bold; font-size: 14px;">ShopSpin Extension</div>
          <div style="font-size: 11px; opacity: 0.9;">Win items at fraction of cost!</div>
        </div>
        <button id="shopspin-promo-close" style="margin-left: auto; background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.7; width: 24px; height: 24px;">×</button>
      </div>
      <div style="font-size: 12px; margin-bottom: 8px; opacity: 0.95;">
        💰 Save up to $${o.toFixed(0)} on these items
      </div>
      <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 6px; border-radius: 6px; font-size: 11px; font-weight: bold;">
        👆 Click any product to start spinning!
      </div>
    `,document.body.appendChild(n),setTimeout(()=>{n.style.transform="translateY(0)",n.style.opacity="1"},100);const r=n.querySelector("#shopspin-promo-close");r==null||r.addEventListener("click",s=>{s.stopPropagation(),this.hideFloatingPromotion()}),n.addEventListener("click",()=>{var s;(s=e[0])!=null&&s.element&&(e[0].element.scrollIntoView({behavior:"smooth",block:"center"}),this.hideFloatingPromotion())}),setTimeout(()=>{this.hideFloatingPromotion()},8e3)}hideFloatingPromotion(){const e=document.getElementById("shopspin-floating-promo");e&&(e.style.transform="translateY(100px)",e.style.opacity="0",setTimeout(()=>e.remove(),500))}removeAllIndicators(){[".shopspin-indicator",".shopspin-value-tooltip",".shopspin-urgent-cta","#shopspin-floating-promo","#shopspin-overlay","#shopspin-address-confirmation"].forEach(t=>{document.querySelectorAll(t).forEach(n=>n.remove())}),this.indicatorElements.clear()}notifyBackground(e){chrome.runtime.sendMessage({type:"PRODUCT_FOUND",product:e})}showOverlay(e){console.debug("ShopSpin: Showing overlay for product:",e.name),this.removeOverlay();const t=document.createElement("div");t.id="shopspin-overlay",t.style.cssText=`
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
    `;const o=t.attachShadow({mode:"open"}),n=document.createElement("div");n.innerHTML=`
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
          <div class="product-name">${e.name}</div>
          <div class="product-price">$${e.price.toFixed(2)}</div>
        </div>
        <div class="controls">
          <input type="number" class="stake-input" id="stake-input" 
                 placeholder="Your stake ($)" min="0.01" max="${Math.min(e.price,1e4)}" step="0.01">
          <div class="probability">
            <div class="prob-text">Win Probability</div>
            <div class="prob-value" id="probability">0%</div>
          </div>
          <button class="spin-btn" id="spin-btn" disabled>Enter Stake First</button>
        </div>
      </div>
    `,o.appendChild(n);const r=o.getElementById("stake-input"),s=o.getElementById("probability"),i=o.getElementById("spin-btn"),c=o.getElementById("close-btn");r.addEventListener("input",()=>{const l=parseFloat(r.value)||0,d=l/e.price,m=Math.min(d*.97,.97)*100;s.textContent=`${m.toFixed(1)}%`,i.disabled=l<=0||l>e.price||l>1e4,i.textContent=l>0?"🎲 Spin to Win!":"Enter Stake First"}),i.addEventListener("click",()=>{const l=parseFloat(r.value);this.enterSpin(e,l)}),c.addEventListener("click",()=>{this.removeOverlay()}),document.body.appendChild(t)}removeOverlay(){const e=document.getElementById("shopspin-overlay");e&&e.remove()}enterSpin(e,t){chrome.runtime.sendMessage({type:"ENTER_SPIN",product:e,stake:t},o=>{this.handleSpinResult(o)})}handleSpinResult(e){var n,r;const t=document.getElementById("shopspin-overlay");if(!(t!=null&&t.shadowRoot))return;const o=t.shadowRoot.querySelector(".container");if(e.won){if(e.requiresUserInfo){this.removeOverlay();const s=this.getCurrentProduct(),i=(n=t.shadowRoot)==null?void 0:n.getElementById("stake-input"),c=parseFloat((i==null?void 0:i.value)||"0");s&&new S(s,c).show();return}if(e.requiresAddressConfirmation&&e.existingUser){this.removeOverlay();const s=this.getCurrentProduct(),i=(r=t.shadowRoot)==null?void 0:r.getElementById("stake-input"),c=parseFloat((i==null?void 0:i.value)||"0");s&&this.showAddressConfirmationModal(s,c,e.existingUser);return}o.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">You Won!</div>
          <div style="font-size: 14px; opacity: 0.9;">${e.message}</div>
        </div>
      `}else o.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Better Luck Next Time!</div>
          <div style="font-size: 14px; opacity: 0.9;">${e.message}</div>
        </div>
      `;setTimeout(()=>this.removeOverlay(),3e3)}getCurrentProduct(){var e;return((e=this.currentContext)==null?void 0:e.primaryProduct)||null}showAddressConfirmationModal(e,t,o){var d,a,p,m,u;console.debug("ShopSpin: Showing address confirmation modal for user:",o.name),this.removeAddressConfirmationModal();const n=document.createElement("div");n.id="shopspin-address-confirmation",n.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;const r=document.createElement("div");r.style.cssText=`
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `,r.innerHTML=`
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h2 style="margin: 0; color: #1f2937;">Congratulations! You Won!</h2>
        <p style="margin: 10px 0 0 0; color: #6b7280;">Please confirm your shipping address</p>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">Prize: ${e.name}</h3>
        <p style="margin: 0; color: #6b7280;">Value: $${e.price.toFixed(2)}</p>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Your Current Shipping Address:</h3>
        <div style="color: #4b5563; line-height: 1.5;">
          <strong>${o.name}</strong><br>
          ${o.email}<br><br>
          ${((d=o.address)==null?void 0:d.street)||"Address not available"}<br>
          ${((a=o.address)==null?void 0:a.city)||""}, ${((p=o.address)==null?void 0:p.state)||""} ${((m=o.address)==null?void 0:m.zipCode)||""}<br>
          ${((u=o.address)==null?void 0:u.country)||""}
          ${o.phone?`<br><br>Phone: ${o.phone}`:""}
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <button id="confirm-address" style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          ✓ Ship to This Address
        </button>
        <button id="update-address" style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          📝 Update Address
        </button>
      </div>

      <div style="text-align: center;">
        <button id="cancel-confirmation" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Cancel
        </button>
      </div>

      <div id="loading-confirmation" style="display: none; text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
        <div>Recording your win...</div>
      </div>

      <div id="success-confirmation" style="display: none; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h3 style="margin: 0 0 10px 0; color: #059669;">Win Recorded Successfully!</h3>
        <p style="margin: 0; color: #6b7280;">We'll contact you soon about shipping details.</p>
      </div>

      <div id="error-confirmation" style="display: none; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <h3 style="margin: 0 0 10px 0; color: #dc2626;">Error</h3>
        <p id="error-message-confirmation" style="margin: 0; color: #6b7280;"></p>
      </div>
    `,n.appendChild(r),document.body.appendChild(n);const s=n.querySelector("#confirm-address"),i=n.querySelector("#update-address"),c=n.querySelector("#cancel-confirmation");s.addEventListener("click",()=>{this.confirmExistingAddress(e,t,o)}),i.addEventListener("click",()=>{this.removeAddressConfirmationModal(),new S(e,t).show()}),c.addEventListener("click",()=>{this.removeAddressConfirmationModal()});const l=g=>{g.key==="Escape"&&(this.removeAddressConfirmationModal(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l)}removeAddressConfirmationModal(){const e=document.getElementById("shopspin-address-confirmation");e&&e.remove()}async confirmExistingAddress(e,t,o){const n=document.getElementById("shopspin-address-confirmation");if(!n)return;const r=n.querySelector("div"),s=n.querySelector("#loading-confirmation"),i=n.querySelector("#success-confirmation"),c=n.querySelector("#error-confirmation"),l=n.querySelector("#error-message-confirmation");r.style.display="none",s.style.display="block";try{const d=await new Promise(a=>{chrome.runtime.sendMessage({type:"CONFIRM_EXISTING_ADDRESS",product:e,stake:t,userInfo:o},a)});s.style.display="none",d.won?(i.style.display="block",setTimeout(()=>this.removeAddressConfirmationModal(),3e3)):(c.style.display="block",l.textContent=d.message||"Unknown error occurred")}catch{s.style.display="none",c.style.display="block",l.textContent="Network error. Please try again."}}debounce(e,t){clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(e,t)}}new C;
