// User registration functionality for ShopSpin extension

interface UserInfo {
  email: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
}

export class UserRegistrationModal {
  private currentProduct: any;
  private currentStake: number;

  constructor(product: any, stake: number) {
    this.currentProduct = product;
    this.currentStake = stake;
  }

  show(): void {
    const modal = document.createElement('div');
    modal.id = 'shopspin-user-registration';
    modal.style.cssText = `
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
    `;

    const form = document.createElement('div');
    form.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;

    form.innerHTML = `
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
    `;

    modal.appendChild(form);
    document.body.appendChild(modal);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const form = document.getElementById('user-registration-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

    cancelBtn.addEventListener('click', () => {
      this.hide();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  private async handleSubmit(): Promise<void> {
    const form = document.getElementById('user-registration-form') as HTMLFormElement;
    const loading = document.getElementById('loading') as HTMLElement;
    const success = document.getElementById('success') as HTMLElement;
    const error = document.getElementById('error') as HTMLElement;
    const errorMessage = document.getElementById('error-message') as HTMLElement;

    // Hide form and show loading
    form.style.display = 'none';
    loading.style.display = 'block';

    try {
      // Collect form data
      const userInfo: UserInfo = {
        name: (document.getElementById('name') as HTMLInputElement).value.trim(),
        email: (document.getElementById('email') as HTMLInputElement).value.trim(),
        address: {
          street: (document.getElementById('street') as HTMLInputElement).value.trim(),
          city: (document.getElementById('city') as HTMLInputElement).value.trim(),
          state: (document.getElementById('state') as HTMLInputElement).value.trim(),
          zipCode: (document.getElementById('zipCode') as HTMLInputElement).value.trim(),
          country: (document.getElementById('country') as HTMLInputElement).value.trim(),
        },
        phone: (document.getElementById('phone') as HTMLInputElement).value.trim() || undefined,
      };

      // Send to background script to complete the win
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'COMPLETE_WIN',
          product: this.currentProduct,
          stake: this.currentStake,
          userInfo
        }, resolve);
      });

      loading.style.display = 'none';

      if ((response as any).won) {
        success.style.display = 'block';
        setTimeout(() => this.hide(), 3000);
      } else {
        error.style.display = 'block';
        errorMessage.textContent = (response as any).message || 'Unknown error occurred';
      }

    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
      errorMessage.textContent = 'Network error. Please check your connection and try again.';
    }
  }

  private hide(): void {
    const modal = document.getElementById('shopspin-user-registration');
    if (modal) {
      modal.remove();
    }
  }
}