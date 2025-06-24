// Input validation utilities

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }
  
  if (email.length > 254) {
    throw new ValidationError('Email is too long');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validateName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Name is required');
  }
  
  if (name.length < 1 || name.length > 100) {
    throw new ValidationError('Name must be between 1 and 100 characters');
  }
  
  // Basic sanitization - remove potentially harmful characters
  if (/[<>\"'&]/.test(name)) {
    throw new ValidationError('Name contains invalid characters');
  }
}

export function validateAddress(address: any): void {
  if (!address || typeof address !== 'object') {
    throw new ValidationError('Address is required');
  }
  
  const required = ['street', 'city', 'state', 'zipCode', 'country'];
  for (const field of required) {
    if (!address[field] || typeof address[field] !== 'string') {
      throw new ValidationError(`Address ${field} is required`);
    }
    
    if (address[field].length > 100) {
      throw new ValidationError(`Address ${field} is too long`);
    }
    
    // Basic sanitization
    if (/[<>\"'&]/.test(address[field])) {
      throw new ValidationError(`Address ${field} contains invalid characters`);
    }
  }
  
  // Enhanced ZIP code validation by country
  if (address.country === 'United States') {
    // US ZIP codes: 12345 or 12345-6789
    if (!/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      throw new ValidationError('Invalid US ZIP code format (should be 12345 or 12345-6789)');
    }
  } else if (address.country === 'Canada') {
    // Canadian postal codes: A1A 1A1
    if (!/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(address.zipCode)) {
      throw new ValidationError('Invalid Canadian postal code format (should be A1A 1A1)');
    }
  } else {
    // Generic validation for other countries
    if (!/^[A-Za-z0-9\s-]{3,12}$/.test(address.zipCode)) {
      throw new ValidationError('Invalid postal code format');
    }
  }
  
  // Enhanced state validation for US addresses
  if (address.country === 'United States') {
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      'DC' // District of Columbia
    ];
    
    if (!validStates.includes(address.state.toUpperCase())) {
      throw new ValidationError('Invalid US state code (use 2-letter abbreviation like CA, NY, TX)');
    }
  }
  
  // Basic address format validation
  if (address.street.length < 5) {
    throw new ValidationError('Street address seems too short to be valid');
  }
  
  if (address.city.length < 2) {
    throw new ValidationError('City name seems too short to be valid');
  }
  
  // Check for obviously fake addresses
  const suspiciousPatterns = [
    /test|fake|invalid|example|dummy/i,
    /123.*main.*st/i,
    /111.*111|222.*222|999.*999/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(address.street) || pattern.test(address.city)) {
      throw new ValidationError('Please provide a valid, real address for shipping');
    }
  }
}

export function validatePhone(phone?: string): void {
  if (phone) {
    if (typeof phone !== 'string') {
      throw new ValidationError('Phone must be a string');
    }
    
    if (phone.length > 20) {
      throw new ValidationError('Phone number is too long');
    }
    
    // Allow digits, spaces, dashes, parentheses, plus sign
    if (!/^[\d\s\-\(\)\+]+$/.test(phone)) {
      throw new ValidationError('Invalid phone number format');
    }
  }
}

export function validateStakeAmount(stake: number, productPrice: number): void {
  if (typeof stake !== 'number' || isNaN(stake)) {
    throw new ValidationError('Stake must be a valid number');
  }
  
  if (stake < 0.01) {
    throw new ValidationError('Minimum stake is $0.01');
  }
  
  if (stake > 10000) {
    throw new ValidationError('Maximum stake is $10,000');
  }
  
  if (stake > productPrice) {
    throw new ValidationError('Stake cannot exceed product price');
  }
}

export function validateProduct(product: any): void {
  if (!product || typeof product !== 'object') {
    throw new ValidationError('Product is required');
  }
  
  if (!product.name || typeof product.name !== 'string') {
    throw new ValidationError('Product name is required');
  }
  
  if (product.name.length > 500) {
    throw new ValidationError('Product name is too long');
  }
  
  if (typeof product.price !== 'number' || isNaN(product.price)) {
    throw new ValidationError('Product price must be a valid number');
  }
  
  if (product.price < 0.01 || product.price > 100000) {
    throw new ValidationError('Product price must be between $0.01 and $100,000');
  }
  
  if (!product.currency || typeof product.currency !== 'string') {
    throw new ValidationError('Product currency is required');
  }
  
  if (product.currency !== 'USD') {
    throw new ValidationError('Only USD currency is supported');
  }
  
  if (!product.url || typeof product.url !== 'string') {
    throw new ValidationError('Product URL is required');
  }
  
  try {
    new URL(product.url);
  } catch {
    throw new ValidationError('Invalid product URL');
  }
  
  if (product.image && typeof product.image !== 'string') {
    throw new ValidationError('Product image must be a string');
  }
  
  if (product.image) {
    try {
      new URL(product.image);
    } catch {
      throw new ValidationError('Invalid product image URL');
    }
  }
}

export function validateProbability(probability: number): void {
  if (typeof probability !== 'number' || isNaN(probability)) {
    throw new ValidationError('Probability must be a valid number');
  }
  
  if (probability < 0 || probability > 1) {
    throw new ValidationError('Probability must be between 0 and 1');
  }
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove potentially harmful characters
    .trim()
    .slice(0, 1000); // Limit length
}