# Statistical Chart

A sophisticated statistical visualization React component that displays a synchronized composite chart combining a **Box-and-Whisker Plot** with a **Normal Distribution / Bell Curve** on a shared horizontal axis.

## Overview

This project provides a professional-grade statistical chart component for visualizing benchmark data. It synchronizes two complementary statistical views:

- **Top Region**: Box-and-Whisker Plot showing quartiles (Q1, Median, Q3) and whiskers (min, max)
- **Bottom Region**: Normal Distribution (Bell Curve) showing the probability density

Both regions share a common X-axis scaled by standard deviations (σ), enabling direct visual comparison between quartile positions and distribution density.

## Features

- **Synchronized Composite Chart**: Box plot and bell curve aligned on shared X-axis
- **Statistical Data Visualization**: Displays min, Q1, median, Q3, max, mean, and standard deviation
- **Animated Entrances**: Smooth animations using Framer Motion for chart elements
- **User Value Marker**: Optional "You" indicator showing where a user's value falls relative to benchmarks
- **Badge Variants**: Three badge types - "Live" (with pulsing indicator), "Top X%", and "Bottom X%"
- **Interactive Tooltips**: Hover tooltips showing statistical values at key points
- **Responsive Design**: Configurable width and height parameters

## Technology Stack

- **React 18** - UI framework with concurrent features
- **TypeScript** - Type-safe statistical interfaces
- **Vite** - Fast build tool and dev server
- **D3.js** - Mathematical calculations for scales and curve generation
- **@visx/visx** - Airbnb's low-level visualization primitives
- **Framer Motion** - Smooth SVG path animations
- **Tailwind CSS 4** - Utility-first styling
- **ESLint** - Code linting with React hooks support

## Installation

```bash
cd statistical-chart
npm install
```

## Development

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Lint the code:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

## Usage

### Basic Example

```tsx
import { StatisticalChart, type BenchmarkData } from './components';

const data: BenchmarkData = {
  min: 45.5,
  q1: 65.2,
  median: 82.7,
  q3: 98.4,
  max: 118.1,
  mean: 82.7,
  standardDev: 15.2,
  userValue: 95.0
};

function App() {
  return (
    <StatisticalChart
      data={data}
      width={1008}
      height={630}
      title="Revenue Growth vs MRR"
      description="Compare your growth rate against peer benchmarks"
      badgeType="live"
      badgeText="Live"
    />
  );
}
```

### Badge Variants

```tsx
// Live badge with pulsing red indicator
<StatisticalChart
  data={data}
  badgeType="live"
  badgeText="Live"
/>

// Top performer badge (green)
<StatisticalChart
  data={data}
  badgeType="top"
  badgeText="Top 10%"
/>

// Below benchmark badge (gray)
<StatisticalChart
  data={data}
  badgeType="bottom"
  badgeText="Bottom 50%"
/>
```

## Data Structure

The `BenchmarkData` interface defines the statistical properties:

```typescript
interface BenchmarkData {
  min: number;           // Q1 - 1.5 * IQR (lower whisker)
  q1: number;           // 25th percentile
  median: number;        // 50th percentile
  q3: number;          // 75th percentile
  max: number;          // Q3 + 1.5 * IQR (upper whisker)
  mean: number;         // Center of the bell curve (μ)
  standardDev: number;  // Standard deviation (σ) for curve calculation
  userValue?: number;   // Optional: User's value to display on chart
}
```

## Component API

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `data` | `BenchmarkData` | Required | Statistical benchmark data |
| `width` | `number` | `1008` | Chart width in pixels |
| `height` | `number` | `630` | Chart height in pixels |
| `title` | `string` | `"Revenue Growth vs MRR"` | Chart title |
| `description` | `string` | `"Compare your growth rate..."` | Chart description |
| `badgeType` | `'live' \| 'top' \| 'bottom'` | `'live'` | Badge variant |
| `badgeText` | `string` | `undefined` | Custom badge text |

## Statistical Math

The bell curve uses the **Probability Density Function (PDF)** for a Normal Distribution:

```
y = (1 / (σ × √(2π))) × e^(-((x - μ)² / (2σ²)))
```

Where:
- μ (mu) = mean
- σ (sigma) = standard deviation
- x = horizontal position

The chart generates 100+ points across ±4 standard deviations to create a smooth curve.

## Project Structure

```
statistical-chart/
├── src/
│   ├── components/
│   │   ├── index.ts              # Component exports
│   │   └── StatisticalChart.tsx  # Main chart component
│   ├── App.tsx                  # Demo application
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## License

MIT
