// Server configuration for ShopSpin extension
export const SERVER_CONFIG = {
  // Environment-based URL configuration
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-shopspin-app.vercel.app'  // Replace with your actual Vercel URL
    : 'http://localhost:3000',
  API_ENDPOINTS: {
    USERS: '/api/users',
    WINS: '/api/wins',
    BETS: '/api/bets',
    STATS: '/api/stats',
    PAYMENTS: {
      CREATE_INTENT: '/api/payments/create-intent',
      WEBHOOKS: '/api/payments/webhooks'
    }
  }
};

// API helper functions
export class ShopSpinAPI {
  private static baseUrl = SERVER_CONFIG.BASE_URL;

  static async createUser(userData: {
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
  }) {
    const response = await fetch(`${this.baseUrl}${SERVER_CONFIG.API_ENDPOINTS.USERS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  static async getUserByEmail(email: string) {
    const response = await fetch(`${this.baseUrl}${SERVER_CONFIG.API_ENDPOINTS.USERS}?email=${encodeURIComponent(email)}`);
    return response.json();
  }

  static async recordBet(betData: {
    userId: string;
    product: {
      name: string;
      price: number;
      currency: string;
      url: string;
      image?: string;
    };
    stakeAmount: number;
    probability: number;
    won: boolean;
  }) {
    const response = await fetch(`${this.baseUrl}${SERVER_CONFIG.API_ENDPOINTS.BETS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(betData),
    });
    return response.json();
  }

  static async updateUser(userId: string, updateData: {
    email?: string;
    name?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phone?: string;
  }) {
    const response = await fetch(`${this.baseUrl}${SERVER_CONFIG.API_ENDPOINTS.USERS}/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return response.json();
  }

  static async recordWin(winData: {
    userId: string;
    product: {
      name: string;
      price: number;
      currency: string;
      url: string;
      image?: string;
    };
    stakeAmount: number;
    probability: number;
  }) {
    const response = await fetch(`${this.baseUrl}${SERVER_CONFIG.API_ENDPOINTS.WINS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(winData),
    });
    return response.json();
  }

  static async createPaymentIntent(paymentData: {
    userId: string;
    stakeAmount: number;
    productPrice: number;
    productName: string;
    productUrl: string;
  }) {
    const response = await fetch(`${this.baseUrl}${SERVER_CONFIG.API_ENDPOINTS.PAYMENTS.CREATE_INTENT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return response.json();
  }

  // Set base URL for environment switching
  static setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}