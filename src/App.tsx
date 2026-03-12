import { StatisticalChart, type BenchmarkData } from './components';

// Sample benchmark data for MRR (Monthly Recurring Revenue)
const sampleData: BenchmarkData = {
  min: 1.97,      // Q1 - 1.5 * IQR
  q1: 9.64,       // 25th percentile
  median: 25.25,   // 50th percentile
  q3: 53.94,       // 75th percentile
  max: 53.94,     // Q3 + 1.5 * IQR
  mean: 29.00,     // Center of the bell curve
  standardDev: 15.2,  // For calculating the curve height
  userValue: 53.94,
  distributionValues: [1.94, 3.94, 9.64, 9.64, 25.25, 46.28, 53.94, 53.94, 53.94]
};

function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="max-w-[1080px] w-full space-y-8">
        {/* Example 1: Live badge */}
        <StatisticalChart
          data={sampleData}
          width={1008}
          height={630}
          title="Revenue Growth vs MRR"
          description="Compare your growth rate and revenue scale against peer benchmarks"
          badgeType="live"
          badgeText="Live"
        />

        {/* Example 2: Top badge */}
        <StatisticalChart
          data={sampleData}
          width={1008}
          height={630}
          title="Revenue Growth vs MRR"
          description="Compare your growth rate and revenue scale against peer benchmarks"
          badgeType="top"
          badgeText="Top 10%"
        />

        {/* Example 3: Bottom badge */}
        <StatisticalChart
          data={sampleData}
          width={1008}
          height={630}
          title="Revenue Growth vs MRR"
          description="Compare your growth rate and revenue scale against peer benchmarks"
          badgeType="bottom"
          badgeText="Bottom 50%"
        />
      </div>
    </div>
  );
}

export default App;
