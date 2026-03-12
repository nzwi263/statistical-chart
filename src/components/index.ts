export { StatisticalChart } from './StatisticalChart';

export interface BenchmarkData {
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
