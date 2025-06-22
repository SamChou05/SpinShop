interface Settings {
  extensionEnabled: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
}

interface SpinHistoryItem {
  timestamp: number;
  product: {
    name: string;
    price: number;
    url: string;
  };
  stake: number;
  won: boolean;
  savings: number;
}

class PopupController {
  private settings: Settings = {
    extensionEnabled: true,
    soundEnabled: false,
    animationsEnabled: true
  };

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadSettings();
    await this.loadStats();
    await this.loadHistory();
    this.setupEventListeners();
  }

  private async loadSettings() {
    const stored = await chrome.storage.sync.get([
      'extensionEnabled',
      'soundEnabled', 
      'animationsEnabled',
      'stripePublishableKey',
      'stripeSecretKey'
    ]);

    this.settings = {
      extensionEnabled: stored.extensionEnabled !== false,
      soundEnabled: stored.soundEnabled || false,
      animationsEnabled: stored.animationsEnabled !== false,
      stripePublishableKey: stored.stripePublishableKey || '',
      stripeSecretKey: stored.stripeSecretKey || ''
    };

    this.updateUI();
  }

  private updateUI() {
    // Update toggles
    this.setToggleState('extension-toggle', this.settings.extensionEnabled);
    this.setToggleState('sound-toggle', this.settings.soundEnabled);
    this.setToggleState('animation-toggle', this.settings.animationsEnabled);

    // Update Stripe inputs
    const publishableInput = document.getElementById('stripe-publishable') as HTMLInputElement;
    const secretInput = document.getElementById('stripe-secret') as HTMLInputElement;
    
    if (publishableInput) publishableInput.value = this.settings.stripePublishableKey || '';
    if (secretInput) secretInput.value = this.settings.stripeSecretKey || '';
  }

  private setToggleState(toggleId: string, active: boolean) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      if (active) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  }

  private async loadStats() {
    const history = await chrome.storage.local.get(['spinHistory']);
    const spins: SpinHistoryItem[] = history.spinHistory || [];

    const totalSpins = spins.length;
    const totalWins = spins.filter(spin => spin.won).length;
    const totalSavings = spins.reduce((sum, spin) => sum + spin.savings, 0);
    const winRate = totalSpins > 0 ? (totalWins / totalSpins) * 100 : 0;

    document.getElementById('total-spins')!.textContent = totalSpins.toString();
    document.getElementById('total-wins')!.textContent = totalWins.toString();
    document.getElementById('total-savings')!.textContent = `$${totalSavings.toFixed(2)}`;
    document.getElementById('win-rate')!.textContent = `${winRate.toFixed(1)}%`;
  }

  private async loadHistory() {
    const history = await chrome.storage.local.get(['spinHistory']);
    const spins: SpinHistoryItem[] = history.spinHistory || [];
    
    const historyContainer = document.getElementById('spin-history')!;
    
    if (spins.length === 0) {
      historyContainer.innerHTML = `
        <div style="text-align: center; opacity: 0.7; font-size: 14px;">
          No spins yet. Find a product to get started!
        </div>
      `;
      return;
    }

    // Show last 5 spins
    const recentSpins = spins.slice(-5).reverse();
    
    historyContainer.innerHTML = recentSpins.map(spin => {
      const date = new Date(spin.timestamp).toLocaleDateString();
      const resultClass = spin.won ? 'win' : 'loss';
      const resultText = spin.won ? 'WON' : 'LOST';
      
      return `
        <div class="history-item">
          <div>
            <div style="font-weight: bold;">${spin.product.name.substring(0, 30)}${spin.product.name.length > 30 ? '...' : ''}</div>
            <div style="opacity: 0.7;">${date} • $${spin.stake.toFixed(2)} stake</div>
          </div>
          <div class="${resultClass}" style="font-weight: bold;">${resultText}</div>
        </div>
      `;
    }).join('');
  }

  private setupEventListeners() {
    // Toggle switches
    document.getElementById('extension-toggle')?.addEventListener('click', () => {
      this.settings.extensionEnabled = !this.settings.extensionEnabled;
      this.saveSettings();
    });

    document.getElementById('sound-toggle')?.addEventListener('click', () => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      this.saveSettings();
    });

    document.getElementById('animation-toggle')?.addEventListener('click', () => {
      this.settings.animationsEnabled = !this.settings.animationsEnabled;
      this.saveSettings();
    });

    // Stripe configuration
    document.getElementById('save-stripe')?.addEventListener('click', () => {
      const publishableInput = document.getElementById('stripe-publishable') as HTMLInputElement;
      const secretInput = document.getElementById('stripe-secret') as HTMLInputElement;
      
      this.settings.stripePublishableKey = publishableInput.value;
      this.settings.stripeSecretKey = secretInput.value;
      this.saveSettings();

      // Show feedback
      const button = document.getElementById('save-stripe') as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Saved!';
      button.style.background = '#10b981';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    });

    // Clear history
    document.getElementById('clear-history')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your spin history?')) {
        await chrome.storage.local.remove(['spinHistory']);
        await this.loadStats();
        await this.loadHistory();
      }
    });
  }

  private async saveSettings() {
    await chrome.storage.sync.set(this.settings);
    this.updateUI();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});