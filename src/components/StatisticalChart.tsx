import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface BenchmarkData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  standardDev: number;
  userValue?: number;
  distributionValues?: number[];
}

type BadgeType = 'live' | 'top' | 'bottom';

interface StatisticalChartProps {
  data: BenchmarkData;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  badgeType?: BadgeType;
  badgeText?: string;
}

interface LabelConfig {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  priority: number; // 3 = highest (Median), 2 = medium (Min/Max), 1 = lowest (Q1/Q3)
}

const TOOLTIP_WIDTH = 80;
const TOOLTIP_HEIGHT = 40;

/**
 * Custom hook to calculate label positions with collision detection and priority-based filtering.
 * Uses a hybrid approach: staggered y-offsets + collision detection + priority filtering.
 */
const useLabelPositions = (
  data: BenchmarkData,
  xScale: d3.ScaleLinear<number, number>,
  boxY: number,
  whiskerY: number,
  boxHeight: number
): LabelConfig[] => {
  return useMemo(() => {
    // Step 1: Calculate initial positions with staggered y-offsets
    // Note: Tooltip renders at (y - 45) to (y - 5), so we need sufficient offset
    const labels: LabelConfig[] = [
      { id: 'min', label: 'Minimum', value: data.min, x: xScale(data.min), y: whiskerY - 60, priority: 2 },
      { id: 'q1', label: 'Q1', value: data.q1, x: xScale(data.q1), y: boxY - 50, priority: 1 },
      { id: 'median', label: 'Median', value: data.median, x: xScale(data.median), y: boxY + boxHeight + 50, priority: 3 },
      { id: 'q3', label: 'Q3', value: data.q3, x: xScale(data.q3), y: boxY - 50, priority: 1 },
      { id: 'max', label: 'Maximum', value: data.max, x: xScale(data.max), y: whiskerY - 60, priority: 2 },
    ];

    // Step 2: Detect overlaps and resolve using priority-based filtering
    const resolveOverlaps = (items: LabelConfig[]): LabelConfig[] => {
      const sortedByPriority = [...items].sort((a, b) => b.priority - a.priority);
      const kept: LabelConfig[] = [];

      for (const item of sortedByPriority) {
        const itemBox = {
          left: item.x - TOOLTIP_WIDTH / 2,
          right: item.x + TOOLTIP_WIDTH / 2,
          top: item.y - TOOLTIP_HEIGHT,
          bottom: item.y
        };

        let hasOverlap = false;
        for (const keptItem of kept) {
          const keptBox = {
            left: keptItem.x - TOOLTIP_WIDTH / 2,
            right: keptItem.x + TOOLTIP_WIDTH / 2,
            top: keptItem.y - TOOLTIP_HEIGHT,
            bottom: keptItem.y
          };

          // Check for rectangle intersection
          const overlaps = !(
            itemBox.right <= keptBox.left ||
            itemBox.left >= keptBox.right ||
            itemBox.bottom <= keptBox.top ||
            itemBox.top >= keptBox.bottom
          );

          if (overlaps) {
            hasOverlap = true;
            break;
          }
        }

        // Only keep if no overlap or if it's the highest priority item
        if (!hasOverlap || item.priority === 3) {
          kept.push(item);
        }
      }

      // Sort back by x position for consistent rendering
      return kept.sort((a, b) => a.x - b.x);
    };

    return resolveOverlaps(labels);
  }, [data, xScale, boxY, whiskerY, boxHeight]);
};

// The Probability Density Function (PDF) for a Normal Distribution
const getNormalY = (x: number, mean: number, stdDev: number): number => {
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.pow(Math.E, exponent);
};

/**
 * Kernel Density Estimation (KDE) functions
 */
const kernelEpanechnikov = (k: number) => {
  return (v: number) => Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
};

const kernelDensityEstimator = (kernel: (v: number) => number, X: number[]) => {
  return (V: number[]) => {
    return X.map(x => [x, d3.mean(V, v => kernel(x - v)) || 0]);
  };
};

interface LiveIndicatorProps {
  badgeType?: BadgeType;
  badgeText?: string;
}

const LiveIndicator: React.FC<LiveIndicatorProps> = ({ badgeType = 'live', badgeText }) => {
  const getStyles = () => {
    switch (badgeType) {
      case 'top':
        return {
          backgroundColor: '#10B981',
          color: '#FAFAFA',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '20px',
        };
      case 'bottom':
        return {
          backgroundColor: '#F5F5F5',
          color: '#171717',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '20px',
        };
      case 'live':
      default:
        return {
          backgroundColor: '#F5F5F5',
          color: '#0A0A0A',
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '24px',
        };
    }
  };

  const styles = getStyles();
  const showRedDot = badgeType === 'live';
  const displayText = badgeText || (badgeType === 'live' ? 'Live' : '');

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-full border"
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: badgeType === 'top' ? '#10B981' : '#E5E5E5',
      }}
    >
      {showRedDot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      <span
        className="tracking-wider"
        style={{
          color: styles.color,
          fontSize: styles.fontSize,
          fontFamily: 'Geist, sans-serif',
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight,
          wordWrap: 'break-word',
        }}
      >
        {displayText}
      </span>
    </div>
  );
};

const Tooltip: React.FC<{ label: string; value: string; x: number; y: number }> = ({ label, value, x, y }) => (
  <foreignObject x={x - 40} y={y - 45} width={80} height={40}>
    <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg text-center">
      <div className="font-medium">{label}</div>
      <div className="text-slate-300">{value}</div>
    </div>
  </foreignObject>
);

/** Renders x-axis line, tick marks, and σ labels for a region */
const RegionXAxis: React.FC<{
  regionHeight: number;
  innerWidth: number;
  stdMarkers: { x: number; label: string }[];
}> = ({ regionHeight, innerWidth, stdMarkers }) => (
  <>
    {/* X-Axis line */}
    <line
      x1={0} x2={innerWidth}
      y1={regionHeight} y2={regionHeight}
      className="stroke-slate-300 stroke-1"
    />
    {/* Tick marks and labels */}
    {stdMarkers.map((marker, i) => (
      <g key={i} transform={`translate(${marker.x}, 0)`}>
        <line
          x1={0} x2={0}
          y1={regionHeight} y2={regionHeight + 8}
          className="stroke-slate-400 stroke-1"
        />
        <text
          x={0}
          y={regionHeight + 22}
          className="text-xs fill-slate-500"
          textAnchor="middle"
        >
          {marker.label}
        </text>
      </g>
    ))}
  </>
);

/** Renders vertical dashed lines at σ markers within a region */
const RegionDashedLines: React.FC<{
  regionHeight: number;
  stdMarkers: { x: number; label: string }[];
}> = ({ regionHeight, stdMarkers }) => (
  <>
    {stdMarkers.map((marker, i) => {
      // Skip the outermost markers (-4σ and 4σ) for dashed lines
      if (i === 0 || i === stdMarkers.length - 1) return null;
      return (
        <line
          key={i}
          x1={marker.x} x2={marker.x}
          y1={0} y2={regionHeight}
          className="stroke-slate-200 stroke-1"
          strokeDasharray="4 4"
        />
      );
    })}
  </>
);

export const StatisticalChart: React.FC<StatisticalChartProps> = ({
  data,
  width = 1008,
  height = 630,
  title = 'Revenue Growth vs MRR',
  description = 'Compare your growth rate and revenue scale against peer benchmarks',
  badgeType = 'live',
  badgeText
}) => {
  const margin = { top: 10, right: 40, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Split the inner height into two equal regions
  const regionGap = 30; // gap between the two regions (includes space for top x-axis labels)
  const topRegionHeight = (innerHeight - regionGap) / 2;
  const bottomRegionHeight = (innerHeight - regionGap) / 2;

  // Shared X scale - uses data range (min to max) with padding to allow distribution to touch x-axis
  const { extendedDomain, xScale } = useMemo(() => {
    const range = data.max - data.min;
    const padding = range * 0.15;
    const domain = [data.min - padding, data.max + padding];
    
    const scale = d3.scaleLinear()
      .domain(domain)
      .range([0, innerWidth]);
      
    return { extendedDomain: domain, xScale: scale };
  }, [innerWidth, data.min, data.max]);

  // KDE calculation
  const kdeData = useMemo(() => {
    const values = data.distributionValues || [];
    if (values.length === 0) return [];

    // Silverman's rule of thumb for bandwidth
    // Handle cases with 0 or 1 elements, or zero variance
    const stdDev = d3.deviation(values) || 0.1;
    const bandwidth = Math.max(0.1, 0.9 * stdDev * Math.pow(values.length, -0.2));

    // Generate ticks across the extended domain
    const ticks = d3.ticks(extendedDomain[0], extendedDomain[1], 100);
    const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), ticks);
    return kde(values);
  }, [data.distributionValues, extendedDomain]);

  // Y scale for the distribution curve — maps to the bottom region only
  const yScale = useMemo(() => {
    let maxY: number;
    if (kdeData.length > 0) {
      maxY = d3.max(kdeData, d => d[1]) || 0;
    } else {
      // Fallback to normal distribution peak
      maxY = getNormalY(data.mean, data.mean, data.standardDev);
    }
    
    // Ensure maxY is at least a small positive value to avoid scale issues
    maxY = Math.max(maxY, 0.0001);
    
    return d3.scaleLinear()
      .domain([0, maxY * 1.1])
      .range([bottomRegionHeight, 0]);
  }, [bottomRegionHeight, kdeData, data.mean, data.standardDev]);

  // Generate the Distribution Curve path
  const distributionCurvePath = useMemo(() => {
    let points: { x: number; y: number }[];

    if (kdeData.length > 0) {
      points = kdeData.map(d => ({
        x: xScale(d[0]),
        y: yScale(d[1])
      }));
    } else {
      points = d3.range(
        extendedDomain[0],
        extendedDomain[1] + 0.01,
        (extendedDomain[1] - extendedDomain[0]) / 100
      ).map(x => ({
        x: xScale(x),
        y: yScale(getNormalY(x, data.mean, data.standardDev))
      }));
    }

    const lineGenerator = d3.line<{ x: number; y: number }>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);

    return lineGenerator(points) || '';
  }, [xScale, yScale, kdeData, data.mean, data.standardDev, extendedDomain]);

  // Generate the Distribution Curve area path
  const distributionCurveAreaPath = useMemo(() => {
    let points: { x: number; y: number }[];

    if (kdeData.length > 0) {
      points = kdeData.map(d => ({
        x: xScale(d[0]),
        y: yScale(d[1])
      }));
    } else {
      points = d3.range(
        extendedDomain[0],
        extendedDomain[1] + 0.01,
        (extendedDomain[1] - extendedDomain[0]) / 100
      ).map(x => ({
        x: xScale(x),
        y: yScale(getNormalY(x, data.mean, data.standardDev))
      }));
    }

    const areaGenerator = d3.area<{ x: number; y: number }>()
      .x(d => d.x)
      .y0(bottomRegionHeight)
      .y1(d => d.y)
      .curve(d3.curveBasis);

    return areaGenerator(points) || '';
  }, [xScale, yScale, bottomRegionHeight, kdeData, data.mean, data.standardDev, extendedDomain]);

  // Box plot positions — centered vertically in the top region
  const boxHeight = 50;
  const boxY = (topRegionHeight - boxHeight) / 2;
  const boxWidth = xScale(data.q3) - xScale(data.q1);
  const whiskerY = boxY + boxHeight / 2;

  // Calculate label positions with collision detection and priority-based filtering
  const labelPositions = useLabelPositions(data, xScale, boxY, whiskerY, boxHeight);

  // Data value markers - evenly spaced tick marks from min to max
  const stdMarkers = useMemo(() => {
    const markers = [];
    const numTicks = 5; // Number of tick marks
    const range = data.max - data.min;
    const step = range / (numTicks - 1);
    
    for (let i = 0; i < numTicks; i++) {
      const value = data.min + i * step;
      markers.push({
        x: xScale(value),
        label: value.toFixed(1)
      });
    }
    return markers;
  }, [xScale, data.min, data.max]);

  // Create initial flat path for bell curve animation (in bottom region)
  const initialPath = useMemo(() => {
    return `M ${xScale(extendedDomain[0])} ${bottomRegionHeight} L ${xScale(extendedDomain[1])} ${bottomRegionHeight}`;
  }, [xScale, bottomRegionHeight, extendedDomain]);

  // Y offset for the bottom region group
  const bottomRegionY = margin.top + topRegionHeight + regionGap;

  return (
    <div className="relative p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2
            style={{
              color: '#2F2F2F',
              fontSize: '20px',
              fontFamily: 'Geist, sans-serif',
              fontWeight: 600,
              lineHeight: '24px',
              wordWrap: 'break-word'
            }}
          >
            {title}
          </h2>
          <LiveIndicator badgeType={badgeType} badgeText={badgeText} />
        </div>
        <p
          style={{
            color: '#404040',
            fontSize: '16px',
            fontFamily: 'Geist, sans-serif',
            fontWeight: 400,
            lineHeight: '24px',
            wordWrap: 'break-word',
            marginTop: '4px'
          }}
        >
          {description}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200">
        <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="bellCurveGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* ═══════════════════════════════════════════════════════════
            TOP REGION — Box Plot (top 50%)
            ═══════════════════════════════════════════════════════════ */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>

          {/* Background fill for top region */}
          <rect
            x={0} y={0}
            width={innerWidth} height={topRegionHeight}
            className="fill-blue-50/30"
            rx={4}
          />

          {/* Vertical dashed lines */}
          <RegionDashedLines regionHeight={topRegionHeight} stdMarkers={stdMarkers} />

          {/* X-Axis with ticks and labels */}
          <RegionXAxis
            regionHeight={topRegionHeight}
            innerWidth={innerWidth}
            stdMarkers={stdMarkers}
          />

          {/* Box Plot Group */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {/* Whisker Line (min to max) */}
            <motion.line
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              x1={xScale(data.min)} x2={xScale(data.max)}
              y1={whiskerY} y2={whiskerY}
              className="stroke-blue-400 stroke-1"
              style={{ originX: '50%' }}
            />

            {/* Min Whisker Cap */}
            <line
              x1={xScale(data.min)} x2={xScale(data.min)}
              y1={whiskerY - 8} y2={whiskerY + 8}
              className="stroke-blue-400 stroke-1"
            />

            {/* Max Whisker Cap */}
            <line
              x1={xScale(data.max)} x2={xScale(data.max)}
              y1={whiskerY - 8} y2={whiskerY + 8}
              className="stroke-blue-400 stroke-1"
            />

            {/* The Box (Q1 to Q3) */}
            <motion.rect
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              x={xScale(data.q1)}
              y={boxY}
              width={boxWidth}
              height={boxHeight}
              className="fill-blue-50 stroke-blue-500 stroke-1"
              style={{ originX: xScale(data.median) }}
            />

            {/* Median Line */}
            <motion.line
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              x1={xScale(data.median)} x2={xScale(data.median)}
              y1={boxY} y2={boxY + boxHeight}
              className="stroke-blue-600 stroke-2"
            />
          </motion.g>

          {/* Tooltips — positioned at key statistical points in top region with collision detection */}
          {labelPositions.map((pos) => (
            <Tooltip
              key={pos.id}
              label={pos.label}
              value={`${pos.value.toFixed(2)}`}
              x={pos.x}
              y={pos.y}
            />
          ))}

          {/* User Value Marker ("You") — top region portion - RENDERED LAST FOR TOPMOST LAYER */}
          {data.userValue !== undefined && (
            <g transform={`translate(${xScale(data.userValue)}, 0)`}>
              <line
                x1={0} x2={0}
                y1={topRegionHeight} y2={0}
                className="stroke-red-500 stroke-2"
                strokeDasharray="6 4"
              />
              <circle
                cx={0} cy={10}
                r={6}
                className="fill-red-500"
              />
            </g>
          )}
        </g>

        {/* ═══════════════════════════════════════════════════════════
            BOTTOM REGION — Bell Curve / Distribution (bottom 50%)
            ═══════════════════════════════════════════════════════════ */}
        <g transform={`translate(${margin.left}, ${bottomRegionY})`}>

          {/* Vertical dashed lines */}
          <RegionDashedLines regionHeight={bottomRegionHeight} stdMarkers={stdMarkers} />

          {/* X-Axis with ticks and labels */}
          <RegionXAxis
            regionHeight={bottomRegionHeight}
            innerWidth={innerWidth}
            stdMarkers={stdMarkers}
          />

          {/* Distribution Curve Area */}
          <motion.path
            initial={{ d: initialPath, opacity: 0 }}
            animate={{ d: distributionCurveAreaPath, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            fill="url(#bellCurveGradient)"
            className="transition-all duration-500"
          />

          {/* Distribution Curve Line */}
          <motion.path
            initial={{ d: initialPath, opacity: 0 }}
            animate={{ d: distributionCurvePath, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="stroke-blue-500 stroke-2 fill-none"
          />

          {/* User Value Marker ("You") — bottom region portion - RENDERED LAST FOR TOPMOST LAYER */}
          {data.userValue !== undefined && (
            <g transform={`translate(${xScale(data.userValue)}, 0)`}>
              <line
                x1={0} x2={0}
                y1={bottomRegionHeight} y2={0}
                className="stroke-red-500 stroke-2"
                strokeDasharray="6 4"
              />
              {/* "You" label badge in the bottom region */}
              <g transform={`translate(0, ${bottomRegionHeight * 0.3})`}>
                <rect
                  x={-35} y={-22}
                  width={70} height={44}
                  rx={6}
                  className="fill-red-500"
                />
                <text
                  x={0} y={-4}
                  className="text-sm font-bold fill-white"
                  textAnchor="middle"
                >
                  You
                </text>
                <text
                  x={0} y={14}
                  className="text-xs font-medium fill-white"
                  textAnchor="middle"
                  opacity={0.9}
                >
                  {data.userValue.toFixed(2)}
                </text>
              </g>
            </g>
          )}
        </g>
      </svg>
      </div>
    </div>
  );
};

export default StatisticalChart;
