# EmmaTech Website

Official website for EmmaTech showcasing RAPHA (Real-time Autonomous Proactive Honeypot Architecture) - a next-generation autonomous cyber defense platform.

## 🚀 Features

- **Modern React Stack**: React 18 with TypeScript for type-safe development
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Performance Optimized**: Code splitting, lazy loading, and optimized builds
- **Serverless Functions**: Netlify Functions for API endpoints
- **Form Handling**: React Hook Form with validation
- **Animations**: Smooth animations with Framer Motion
- **Testing**: Unit tests with Vitest and React Testing Library

## 📦 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **styled-components** for component-scoped styling
- **Framer Motion** for animations
- **React Hook Form** for form handling
- **Axios** for API requests

### Backend
- **Netlify Functions** for serverless API endpoints
- **TypeScript** for type-safe serverless functions

### Testing
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **jest-axe** for accessibility testing

## 📁 Project Structure

```
src/
├── components/     # React components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── HeroSection.tsx
│   ├── ProblemSection.tsx
│   ├── SolutionSection.tsx
│   ├── WorkflowSection.tsx
│   ├── CustomerSection.tsx
│   ├── WaitlistModal.tsx
│   ├── InvestorModal.tsx
│   └── Footer.tsx
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── api/            # API client and endpoints
├── styles/         # Global styles and theme
└── test/           # Test utilities

netlify/
└── functions/      # Serverless functions
    ├── waitlist.ts
    └── email.ts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Development

```bash
# Start development server with Netlify Functions
npm run dev

# Start Vite only (without functions)
npm run dev:vite

# Run tests
npm test

# Run tests with UI
npm test:ui

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will be available at `http://localhost:8888`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run accessibility tests
npm test -- accessibility
```

## 🎨 Design System

The website uses a comprehensive design system with:

- **Colors**: Primary blue, neutral grays, semantic colors
- **Typography**: Inter font family with defined scales
- **Spacing**: 8px grid system
- **Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px), Wide (1440px)

See `src/styles/theme.ts` for the complete design system.

## ♿ Accessibility

The website is built with accessibility in mind:

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Focus management in modals
- ARIA labels and live regions
- Color contrast ratios meet standards

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for details.

## 🚀 Deployment

The site is configured for deployment on Netlify.

### Automatic Deployment

Push to the main branch triggers automatic deployment.

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=
NODE_ENV=production
```

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure accessibility standards are met
4. Update documentation as needed

## 📄 License

© 2025 EmmaTech. All rights reserved.

---

**DETECT. DECEIVE. DEFEND.**
