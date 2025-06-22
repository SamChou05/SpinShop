var u=Object.defineProperty;var m=(a,e,t)=>e in a?u(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var p=(a,e,t)=>m(a,typeof e!="symbol"?e+"":e,t);class b{detectProduct(){const e=this.detectFromJsonLd();if(e)return e;const t=this.detectFromOpenGraph();if(t)return t;const n=this.detectFromTextScraping();return n||null}detectFromJsonLd(){const e=document.querySelectorAll('script[type="application/ld+json"]');for(const t of e)try{const n=JSON.parse(t.textContent||""),i=this.findProductInJsonLd(n);if(i)return i}catch{continue}return null}findProductInJsonLd(e){var t,n,i;if(Array.isArray(e)){for(const o of e){const r=this.findProductInJsonLd(o);if(r)return r}return null}if(e["@type"]==="Product"||e.type==="Product"){const o=e.offers||e.Offers,r=Array.isArray(o)?o[0]:o;if(r&&r.price)return{name:e.name||e.title||"",price:parseFloat(r.price),currency:r.priceCurrency||"USD",image:((n=(t=e.image)==null?void 0:t[0])==null?void 0:n.url)||((i=e.image)==null?void 0:i.url)||e.image||void 0,url:window.location.href}}for(const o in e)if(typeof e[o]=="object"&&e[o]!==null){const r=this.findProductInJsonLd(e[o]);if(r)return r}return null}detectFromOpenGraph(){const e=document.querySelector('meta[property="product:price:amount"]'),t=document.querySelector('meta[property="product:price:currency"]'),n=document.querySelector('meta[property="og:title"]'),i=document.querySelector('meta[property="og:image"]');if(e&&n){const o=parseFloat(e.getAttribute("content")||"");if(!isNaN(o))return{name:n.getAttribute("content")||"",price:o,currency:(t==null?void 0:t.getAttribute("content"))||"USD",image:(i==null?void 0:i.getAttribute("content"))||void 0,url:window.location.href}}return null}detectFromTextScraping(){var r;const e=/\$([0-9,]+(?:\.[0-9]{2})?)/g,t=document.body.innerText||document.body.textContent||"",n=Array.from(t.matchAll(e));if(n.length===0)return null;let i="",o=0;for(const s of n){const c=parseFloat(s[1].replace(/,/g,""));if(c<1||c>1e4)continue;const d=this.findElementContainingText(s[0]);if(d){const l=this.findNearestHeading(d);if(l&&l.textContent){i=l.textContent.trim(),o=c;break}}}if(!i&&o===0){const s=document.querySelector("h1");if(s&&n.length>0){const c=parseFloat(n[0][1].replace(/,/g,""));c>=1&&c<=1e4&&(i=((r=s.textContent)==null?void 0:r.trim())||"",o=c)}}return i&&o>0?{name:i,price:o,currency:"USD",url:window.location.href}:null}findElementContainingText(e){var i;const t=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null);let n;for(;n=t.nextNode();)if((i=n.textContent)!=null&&i.includes(e))return n.parentElement;return null}findNearestHeading(e){var n,i;let t=e;for(let o=0;o<5;o++){const r=t.querySelector("h1, h2, h3")||((n=t.previousElementSibling)==null?void 0:n.querySelector("h1, h2, h3"))||((i=t.nextElementSibling)==null?void 0:i.querySelector("h1, h2, h3"));if(r)return r;if(t=t.parentElement||t,!t||t===document.body)break}return null}}class f{constructor(){p(this,"detector",new b);p(this,"currentProduct",null);p(this,"isExtensionEnabled",!0);this.init()}async init(){const e=await chrome.storage.sync.get(["extensionEnabled"]);this.isExtensionEnabled=e.extensionEnabled!==!1,this.isExtensionEnabled&&(chrome.storage.onChanged.addListener(t=>{t.extensionEnabled&&(this.isExtensionEnabled=t.extensionEnabled.newValue,this.isExtensionEnabled||this.removeOverlay())}),this.detectAndNotify(),this.setupObservers())}setupObservers(){new MutationObserver(n=>{n.some(o=>o.type==="childList"&&o.addedNodes.length>0)&&this.debounce(()=>this.detectAndNotify(),1e3)}).observe(document.body,{childList:!0,subtree:!0});let t=location.href;new MutationObserver(()=>{const n=location.href;n!==t&&(t=n,setTimeout(()=>this.detectAndNotify(),500))}).observe(document,{subtree:!0,childList:!0}),window.addEventListener("popstate",()=>{setTimeout(()=>this.detectAndNotify(),500)})}detectAndNotify(){if(!this.isExtensionEnabled)return;const e=this.detector.detectProduct();e&&(!this.currentProduct||this.currentProduct.name!==e.name||this.currentProduct.price!==e.price)?(this.currentProduct=e,this.notifyBackground(e),this.showOverlay(e)):!e&&this.currentProduct&&(this.currentProduct=null,this.removeOverlay())}notifyBackground(e){chrome.runtime.sendMessage({type:"PRODUCT_FOUND",product:e})}showOverlay(e){this.removeOverlay();const t=document.createElement("div");t.id="shopspin-overlay",t.style.cssText=`
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
    `;const n=t.attachShadow({mode:"open"}),i=document.createElement("div");i.innerHTML=`
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
    `,n.appendChild(i);const o=n.getElementById("stake-input"),r=n.getElementById("probability"),s=n.getElementById("spin-btn"),c=n.getElementById("close-btn");o.addEventListener("input",()=>{const d=parseFloat(o.value)||0,l=Math.min(d/e.price*100,100);r.textContent=`${l.toFixed(1)}%`,s.disabled=d<=0||d>e.price,s.textContent=d>0?"🎲 Spin to Win!":"Enter Stake First"}),s.addEventListener("click",()=>{const d=parseFloat(o.value);this.enterSpin(e,d)}),c.addEventListener("click",()=>{this.removeOverlay()}),document.body.appendChild(t)}removeOverlay(){const e=document.getElementById("shopspin-overlay");e&&e.remove()}enterSpin(e,t){chrome.runtime.sendMessage({type:"ENTER_SPIN",product:e,stake:t},n=>{this.handleSpinResult(n)})}handleSpinResult(e){const t=document.getElementById("shopspin-overlay");if(!(t!=null&&t.shadowRoot))return;const n=t.shadowRoot.querySelector(".container");e.won?n.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">You Won!</div>
          <div style="font-size: 14px; opacity: 0.9;">${e.message}</div>
        </div>
      `:n.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Better Luck Next Time!</div>
          <div style="font-size: 14px; opacity: 0.9;">${e.message}</div>
        </div>
      `,setTimeout(()=>this.removeOverlay(),3e3)}debounce(e,t){clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(e,t)}}new f;
