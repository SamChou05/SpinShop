var f=Object.defineProperty;var h=(d,e,t)=>e in d?f(d,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):d[e]=t;var m=(d,e,t)=>h(d,typeof e!="symbol"?e+"":e,t);class b{detectProduct(){if(!this.isLikelyProductPage())return null;const e=this.detectFromJsonLd();if(e&&this.validateProduct(e))return e;const t=this.detectFromSiteSpecificSelectors();if(t&&this.validateProduct(t))return t;const o=this.detectFromOpenGraph();if(o&&this.validateProduct(o))return o;const n=this.detectFromTextScraping();return n&&this.validateProduct(n)?n:null}isLikelyProductPage(){const e=window.location.href.toLowerCase(),t=window.location.pathname.toLowerCase(),n=["/product/","/item/","/p/","/dp/","/pd/","/products/","product-","item-","/buy/","/shop/","/store/"].some(s=>e.includes(s)||t.includes(s)),i=["amazon.","ebay.","etsy.","shopify","walmart.","target.","bestbuy.","homedepot.","lowes.","costco.","wayfair.","overstock.","newegg.","alibaba.","aliexpress."].some(s=>window.location.hostname.includes(s)),c=!!(document.querySelector('[data-testid*="price"], [class*="price"], [id*="price"]')||document.querySelector('[data-testid*="product"], [class*="product"], [id*="product"]')||document.querySelector('button[class*="cart"], button[class*="buy"], button[id*="buy"]')||document.querySelector('[class*="add-to-cart"], [id*="add-to-cart"]'));return n||i||c}validateProduct(e){if(!e.name||e.name.length<3||e.name.length>200||!e.price||e.price<.01||e.price>5e4)return!1;const t=["lorem ipsum","test product","sample","placeholder","example","demo","404","error","not found"],o=e.name.toLowerCase();return!t.some(n=>o.includes(n))}detectFromSiteSpecificSelectors(){const e=window.location.hostname.toLowerCase();return e.includes("amazon.")?this.detectAmazonProduct():e.includes("ebay.")?this.detectEbayProduct():e.includes("shopify")||document.querySelector('meta[name="shopify-digital-wallet"]')?this.detectShopifyProduct():this.detectGenericEcommerceProduct()}detectAmazonProduct(){var r,i,c,s;const e=(i=(r=document.querySelector('#productTitle, [data-testid="title"]'))==null?void 0:r.textContent)==null?void 0:i.trim(),t=[".a-price-whole",".a-price .a-offscreen",'[data-testid="price-whole"]',".a-price-symbol + .a-price-whole","#price_inside_buybox"];let o=0;for(const a of t){const l=document.querySelector(a);if(l){const u=((c=l.textContent)==null?void 0:c.replace(/[^0-9.,]/g,""))||"";if(o=parseFloat(u.replace(/,/g,"")),o>0)break}}const n=((s=document.querySelector('#landingImage, [data-testid="hero-image"]'))==null?void 0:s.getAttribute("src"))||void 0;return e&&o>0?{name:e,price:o,currency:"USD",image:n,url:window.location.href}:null}detectEbayProduct(){var n,r,i;const e=(r=(n=document.querySelector('[data-testid="x-item-title-label"], .x-item-title-label'))==null?void 0:n.textContent)==null?void 0:r.trim(),t=['[data-testid="notmi-price"] .notranslate',".u-flL .bold",'.notranslate[role="text"]'];let o=0;for(const c of t){const s=document.querySelector(c);if(s){const a=((i=s.textContent)==null?void 0:i.replace(/[^0-9.,]/g,""))||"";if(o=parseFloat(a.replace(/,/g,"")),o>0)break}}return e&&o>0?{name:e,price:o,currency:"USD",url:window.location.href}:null}detectShopifyProduct(){var n,r,i;const e=(r=(n=document.querySelector('.product-title, .product__title, [class*="product-title"]'))==null?void 0:n.textContent)==null?void 0:r.trim(),t=[".price, .product-price, .money, .product__price",'[class*="price"]:not([class*="compare"]):not([class*="original"])','[data-testid*="price"]'];let o=0;for(const c of t){const s=document.querySelector(c);if(s&&!s.classList.contains("compare-price")){const a=((i=s.textContent)==null?void 0:i.replace(/[^0-9.,]/g,""))||"";if(o=parseFloat(a.replace(/,/g,"")),o>0)break}}return e&&o>0?{name:e,price:o,currency:"USD",url:window.location.href}:null}detectGenericEcommerceProduct(){var r;const e=['h1[class*="product"]','h1[class*="title"]','h1[data-testid*="title"]',".product-name",".product-title",".item-title",".product__title",'[data-testid*="product-title"]','[data-testid*="product-name"]'];let t="";for(const i of e){const c=document.querySelector(i);if((r=c==null?void 0:c.textContent)!=null&&r.trim()){t=c.textContent.trim();break}}const o=['[class*="price"]:not([class*="compare"]):not([class*="original"]):not([class*="msrp"])','[data-testid*="price"]',"[data-price]",'[id*="price"]',".cost",".amount",".value",".money"];let n=0;for(const i of o){const c=document.querySelectorAll(i);for(const s of c){if(!s.textContent)continue;const a=s.className.toLowerCase();if(a.includes("compare")||a.includes("original")||a.includes("msrp")||a.includes("strike"))continue;const l=s.textContent.replace(/[^0-9.,]/g,""),u=parseFloat(l.replace(/,/g,""));if(u>0&&u<5e4){n=u;break}}if(n>0)break}return t&&n>0?{name:t,price:n,currency:"USD",url:window.location.href}:null}detectFromJsonLd(){const e=document.querySelectorAll('script[type="application/ld+json"]');for(const t of e)try{const o=JSON.parse(t.textContent||""),n=this.findProductInJsonLd(o);if(n)return n}catch{continue}return null}findProductInJsonLd(e){var t,o,n;if(Array.isArray(e)){for(const r of e){const i=this.findProductInJsonLd(r);if(i)return i}return null}if(e["@type"]==="Product"||e.type==="Product"){const r=e.offers||e.Offers,i=Array.isArray(r)?r[0]:r;if(i&&i.price)return{name:e.name||e.title||"",price:parseFloat(i.price),currency:i.priceCurrency||"USD",image:((o=(t=e.image)==null?void 0:t[0])==null?void 0:o.url)||((n=e.image)==null?void 0:n.url)||e.image||void 0,url:window.location.href}}for(const r in e)if(typeof e[r]=="object"&&e[r]!==null){const i=this.findProductInJsonLd(e[r]);if(i)return i}return null}detectFromOpenGraph(){const e=document.querySelector('meta[property="product:price:amount"]'),t=document.querySelector('meta[property="product:price:currency"]'),o=document.querySelector('meta[property="og:title"]'),n=document.querySelector('meta[property="og:image"]');if(e&&o){const r=parseFloat(e.getAttribute("content")||"");if(!isNaN(r))return{name:o.getAttribute("content")||"",price:r,currency:(t==null?void 0:t.getAttribute("content"))||"USD",image:(n==null?void 0:n.getAttribute("content"))||void 0,url:window.location.href}}return null}detectFromTextScraping(){const e=[/\$\s*([0-9,]+(?:\.[0-9]{2})?)/g,/USD\s*([0-9,]+(?:\.[0-9]{2})?)/g,/([0-9,]+(?:\.[0-9]{2})?)\s*USD/g,/Price:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi,/Cost:\s*\$([0-9,]+(?:\.[0-9]{2})?)/gi];let t=0,o=null;for(const r of e){const i=document.querySelectorAll("*");for(const c of i){if(!c.textContent)continue;const s=c.tagName.toLowerCase(),a=c.className.toLowerCase();if(s==="nav"||s==="footer"||a.includes("nav")||a.includes("footer")||a.includes("sidebar")||a.includes("menu"))continue;const l=Array.from(c.textContent.matchAll(r));for(const u of l){const p=parseFloat(u[1].replace(/,/g,""));p>.01&&p<5e4&&this.calculatePriceElementScore(c)>0&&p>t&&(t=p,o=c)}}if(t>0)break}if(!o||t===0)return null;const n=this.findProductTitle(o);return n&&n.length>=3?{name:n,price:t,currency:"USD",url:window.location.href}:null}calculatePriceElementScore(e){let t=0;const o=e.className.toLowerCase(),n=e.id.toLowerCase();o.includes("price")&&(t+=10),o.includes("cost")&&(t+=8),o.includes("amount")&&(t+=6),o.includes("value")&&(t+=4),n.includes("price")&&(t+=10),n.includes("cost")&&(t+=8),(o.includes("compare")||o.includes("original")||o.includes("msrp")||o.includes("strike")||o.includes("discount")||o.includes("save"))&&(t-=15);const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(t+=2),t}findProductTitle(e){var r,i;const t=document.querySelectorAll("h1");for(const c of t){const s=(r=c.textContent)==null?void 0:r.trim();if(s&&s.length>=3&&s.length<=200&&!s.toLowerCase().includes("home")&&!s.toLowerCase().includes("category")&&!s.toLowerCase().includes("shop"))return s}const o=['[class*="product-title"]','[class*="product-name"]','[class*="item-title"]','[class*="title"]','[data-testid*="title"]','[data-testid*="name"]'];for(const c of o){const s=document.querySelectorAll(c);for(const a of s){const l=(i=a.textContent)==null?void 0:i.trim();if(l&&l.length>=3&&l.length<=200&&this.areElementsRelated(a,e))return l}}const n=this.findNearestHeading(e);if(n!=null&&n.textContent){const c=n.textContent.trim();if(c.length>=3&&c.length<=200)return c}return""}areElementsRelated(e,t){const o=e.getBoundingClientRect(),n=t.getBoundingClientRect();if(Math.abs(o.top-n.top)<200)return!0;let i=e.parentElement,c=t.parentElement;for(let s=0;s<3;s++){if(i===c)return!0;i&&(i=i.parentElement),c&&(c=c.parentElement)}return!1}findNearestHeading(e){var o,n;let t=e;for(let r=0;r<5;r++){const i=t.querySelector("h1, h2, h3")||((o=t.previousElementSibling)==null?void 0:o.querySelector("h1, h2, h3"))||((n=t.nextElementSibling)==null?void 0:n.querySelector("h1, h2, h3"));if(i)return i;if(t=t.parentElement||t,!t||t===document.body)break}return null}}class y{constructor(){m(this,"detector",new b);m(this,"currentProduct",null);m(this,"isExtensionEnabled",!0);this.init()}async init(){const e=await chrome.storage.sync.get(["extensionEnabled"]);this.isExtensionEnabled=e.extensionEnabled!==!1,this.isExtensionEnabled&&(chrome.storage.onChanged.addListener(t=>{t.extensionEnabled&&(this.isExtensionEnabled=t.extensionEnabled.newValue,this.isExtensionEnabled||this.removeOverlay())}),this.detectAndNotify(),this.setupObservers())}setupObservers(){new MutationObserver(o=>{o.some(r=>r.type==="childList"&&r.addedNodes.length>0)&&this.debounce(()=>this.detectAndNotify(),1e3)}).observe(document.body,{childList:!0,subtree:!0});let t=location.href;new MutationObserver(()=>{const o=location.href;o!==t&&(t=o,setTimeout(()=>this.detectAndNotify(),500))}).observe(document,{subtree:!0,childList:!0}),window.addEventListener("popstate",()=>{setTimeout(()=>this.detectAndNotify(),500)})}detectAndNotify(){if(!this.isExtensionEnabled)return;const e=this.detector.detectProduct();e&&(!this.currentProduct||this.currentProduct.name!==e.name||this.currentProduct.price!==e.price)?(this.currentProduct=e,this.notifyBackground(e),this.showOverlay(e)):!e&&this.currentProduct&&(this.currentProduct=null,this.removeOverlay())}notifyBackground(e){chrome.runtime.sendMessage({type:"PRODUCT_FOUND",product:e})}showOverlay(e){this.removeOverlay();const t=document.createElement("div");t.id="shopspin-overlay",t.style.cssText=`
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
                 placeholder="Your stake ($)" min="0.01" max="${e.price}" step="0.01">
          <div class="probability">
            <div class="prob-text">Win Probability</div>
            <div class="prob-value" id="probability">0%</div>
          </div>
          <button class="spin-btn" id="spin-btn" disabled>Enter Stake First</button>
        </div>
      </div>
    `,o.appendChild(n);const r=o.getElementById("stake-input"),i=o.getElementById("probability"),c=o.getElementById("spin-btn"),s=o.getElementById("close-btn");r.addEventListener("input",()=>{const a=parseFloat(r.value)||0,l=Math.min(a/e.price*100,100);i.textContent=`${l.toFixed(1)}%`,c.disabled=a<=0||a>e.price,c.textContent=a>0?"🎲 Spin to Win!":"Enter Stake First"}),c.addEventListener("click",()=>{const a=parseFloat(r.value);this.enterSpin(e,a)}),s.addEventListener("click",()=>{this.removeOverlay()}),document.body.appendChild(t)}removeOverlay(){const e=document.getElementById("shopspin-overlay");e&&e.remove()}enterSpin(e,t){chrome.runtime.sendMessage({type:"ENTER_SPIN",product:e,stake:t},o=>{this.handleSpinResult(o)})}handleSpinResult(e){const t=document.getElementById("shopspin-overlay");if(!(t!=null&&t.shadowRoot))return;const o=t.shadowRoot.querySelector(".container");e.won?o.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">You Won!</div>
          <div style="font-size: 14px; opacity: 0.9;">${e.message}</div>
        </div>
      `:o.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Better Luck Next Time!</div>
          <div style="font-size: 14px; opacity: 0.9;">${e.message}</div>
        </div>
      `,setTimeout(()=>this.removeOverlay(),3e3)}debounce(e,t){clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(e,t)}}new y;
