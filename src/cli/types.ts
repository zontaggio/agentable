import { RunOptions } from '../types';

export interface CliOptions {
  runOptions: RunOptions;
  host: string;
  port: number;
  setup: boolean;
}
