# 🏇 rHorseBet - Advanced Horse Racing Analytics

A modern, professional horse racing analytics platform built with React, TypeScript, and advanced ML algorithms. Provides comprehensive betting insights for both trotting and gallop races with real-time data analysis.

![rHorseBet Logo](public/rHorseBet.png)

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time Race Data**: Live tracking of races, tracks, and betting odds
- **Dual Sport Support**: Comprehensive analytics for both trotting and gallop racing
- **ML-Powered Predictions**: Advanced machine learning algorithms for race outcome predictions
- **Upset Detection**: Sophisticated algorithms to identify potential upset opportunities
- **Multi-Game Support**: V4, V75, V86, Vinnare, and other betting game types

### 📊 **Advanced Analytics**
- **Performance Metrics**: Driver/jockey ratings, trainer statistics, form analysis
- **Head-to-Head Analysis**: Historical matchup data between horses
- **Equipment Impact**: Analysis of equipment changes and their effects
- **Class & Distance Analysis**: Performance correlation with race class and distance
- **Time Performance**: Detailed speed analysis for trotting races

### 🎨 **Modern User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Universal Column Controls**: Customizable table views with persistent settings
- **Dark/Light Themes**: Beautiful Tailwind CSS styling with smooth transitions
- **Intuitive Navigation**: Date picker, track selection, and game filtering
- **Real-time Updates**: Live data fetching with loading states

## 🚀 Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and enhanced developer experience
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

### **Development Tools**
- **ESLint** - Code linting with TypeScript-aware rules
- **PostCSS** - CSS processing with modern features
- **Hot Module Replacement (HMR)** - Instant feedback during development

### **Data & Analytics**
- **Custom ML Algorithms** - Proprietary machine learning models
- **Real-time API Integration** - Live horse racing data feeds
- **Advanced Calculations** - Complex point systems and rating algorithms

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with ES2020+ support

### Quick Start
```bash
# Clone the repository
git clone https://github.com/ragonline/rHorseBet.git
cd rHorseBet

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── GameDetails.tsx     # Race details and analytics
│   ├── StartListTable.tsx  # Horse listings with sorting
│   ├── ColumnVisibilityControls.tsx # Table customization
│   └── ...
├── calculations/        # ML algorithms and analytics
│   ├── galopp/            # Gallop-specific calculations
│   ├── trav/              # Trotting-specific calculations
│   ├── shared/            # Common calculation utilities
│   └── utils/             # Helper functions
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── ...
```

## 🏁 Race Types & Betting Games

### **Supported Race Types**
- **Trotting (Trav)** - Traditional harness racing
- **Gallop** - Flat and steeplechase racing

### **Betting Game Types**
- **V4/V5** - Pick 4/5 winners
- **V64/V65** - Pick 6 winners with variations
- **V75** - Pick 7 winners (most popular)
- **V86** - Pick 8 winners
- **Vinnare** - Single race winner betting
- **Plats** - Place betting
- **Tvilling/Trio** - Exacta/Trifecta betting

## 🧠 ML Algorithms & Analytics

### **Prediction Models**
- **Form Analysis** - Recent performance trends
- **Class Ratings** - Competition level adjustments
- **Speed Figures** - Time-based performance metrics
- **Driver/Jockey Performance** - Human factor analysis
- **Equipment Impact** - Gear change effects

### **Upset Detection**
- **Value Identification** - Overlay betting opportunities
- **Public vs. Model** - Comparison with crowd wisdom
- **Historical Patterns** - Long-term trend analysis

## 🎯 Key Features Deep Dive

### **Universal Column Controls**
- Global settings across all races
- Default hidden columns (Rating, $/start this year, $/start 2 years)
- Reset to defaults functionality
- Toggle all columns on/off
- Persistent user preferences

### **Responsive Data Tables**
- Sortable columns with visual indicators
- Dynamic column headers (Driver vs Jockey based on sport)
- Optimized rendering for large datasets
- Mobile-friendly horizontal scrolling

### **Real-time Data Integration**
- Live odds updates
- Race result integration
- Track condition monitoring
- Weather impact analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🐛 Bug Reports & Feature Requests

Please open an issue on GitHub with:
- **Bug Reports**: Steps to reproduce, expected vs actual behavior
- **Feature Requests**: Clear description of the proposed functionality

## ⚡ Performance

- **Fast Loading**: Optimized bundle splitting and lazy loading
- **Efficient Rendering**: React.memo and useMemo optimizations
- **Small Bundle Size**: Tree-shaking and dead code elimination
- **Modern Standards**: ES2020+ features for optimal performance

---

**Built with ❤️ for horse racing enthusiasts and serious bettors.**
