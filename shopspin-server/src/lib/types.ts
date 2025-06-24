export interface User {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  name: string;
  price: number;
  currency: string;
  url: string;
  image?: string;
}

export interface Bet {
  id: string;
  userId: string;
  product: Product;
  stakeAmount: number;
  probability: number;
  won: boolean;
  betTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Win {
  id: string;
  userId: string;
  product: Product;
  stakeAmount: number;
  probability: number;
  winTimestamp: Date;
  status: 'pending' | 'processing' | 'ordered' | 'shipped' | 'delivered' | 'cancelled';
  orderDetails?: {
    orderNumber?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request types for API endpoints
export interface CreateUserRequest {
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

export interface RecordBetRequest {
  userId: string;
  product: Product;
  stakeAmount: number;
  probability: number;
  won: boolean;
}

export interface RecordWinRequest {
  userId: string;
  product: Product;
  stakeAmount: number;
  probability: number;
}

export interface UpdateWinStatusRequest {
  winId: string;
  status: Win['status'];
  orderDetails?: Win['orderDetails'];
}