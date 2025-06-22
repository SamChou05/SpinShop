// Jest setup file

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    id: 'test-extension-id',
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
  },
} as any;

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint32Array) => {
      // Return predictable values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = 0x80000000; // 50% probability
      }
      return arr;
    }),
  },
});

// Mock fetch
global.fetch = jest.fn();