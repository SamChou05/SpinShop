# ShopSpin Chrome Extension

A Manifest v3 Chrome extension that turns shopping into a game by allowing users to stake money for a chance to win products at discounted prices.

## Features

- 🎯 **Product Detection**: Automatically detects products on shopping sites using JSON-LD, OpenGraph, and text scraping
- 🎲 **Sweepstakes Gameplay**: Stake any amount up to the product price with winning probability = stake/price
- 🔒 **Secure RNG**: Uses cryptographically secure random number generation
- 💳 **Stripe Integration**: Secure payment processing for discounted wins
- ⚙️ **Customizable**: Toggle sounds, animations, and extension on/off
- 📊 **Statistics**: Track your wins, losses, and total savings

## Tech Stack

- **Frontend**: TypeScript, React, Tailwind CSS
- **Build**: Vite
- **State Management**: Zustand
- **Testing**: Jest, Testing Library
- **Payments**: Stripe
- **Linting**: ESLint, Prettier

## Installation

### For Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd shopspin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Stripe keys
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### For Production

1. Download the latest release from the Chrome Web Store (coming soon)

## Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Add keys to the extension settings or environment variables
4. For development, use test keys (pk_test_... and sk_test_...)

## Usage

1. **Browse Products**: Visit any shopping site (Amazon, eBay, etc.)
2. **Spin Overlay**: When a product is detected, the ShopSpin overlay appears
3. **Set Stake**: Enter how much you want to stake (up to the product price)
4. **View Probability**: See your winning probability in real-time
5. **Spin to Win**: Click the spin button to try your luck!
6. **Complete Purchase**: If you win, pay the discounted amount via Stripe

## Testing

Run unit tests:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

Run type checking:
```bash
npm run typecheck
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types

## Architecture

### Content Script (`src/content/`)
- Detects products on web pages
- Injects the game overlay UI
- Handles user interactions

### Background Service Worker (`src/background/`)
- Manages sweepstakes logic
- Handles Stripe payment processing
- Stores user statistics

### Popup (`src/popup/`)
- Extension settings and configuration
- User statistics and history
- Stripe account management

### Product Detection Algorithm

1. **JSON-LD Structured Data**: Highest priority, most reliable
2. **OpenGraph Meta Tags**: Fallback for sites without JSON-LD
3. **Text Scraping**: Last resort using regex and heuristics
