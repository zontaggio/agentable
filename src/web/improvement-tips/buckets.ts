import { ActionPlanBucket, RecommendationItem } from '../../types';

function computeBucketTargets(total: number): {
  critical: number;
  highLeverage: number;
  quickWins: number;
} {
  if (total <= 0) {
    return { critical: 0, highLeverage: 0, quickWins: 0 };
  }
  if (total === 1) {
    return { critical: 1, highLeverage: 0, quickWins: 0 };
  }
  if (total === 2) {
    return { critical: 1, highLeverage: 1, quickWins: 0 };
  }
  if (total === 3) {
    return { critical: 1, highLeverage: 1, quickWins: 1 };
  }

  let critical = Math.max(1, Math.min(6, Math.round(total * 0.22)));
  let highLeverage = Math.max(1, Math.round(total * 0.43));

  let quickWins = total - critical - highLeverage;

  if (quickWins < 1) {
    const deficit = 1 - quickWins;
    if (highLeverage - deficit >= 1) {
      highLeverage -= deficit;
    } else if (critical - deficit >= 1) {
      critical -= deficit;
    }
    quickWins = 1;
  }

  const allocated = critical + highLeverage + quickWins;
  if (allocated !== total) {
    quickWins += total - allocated;
  }

  return {
    critical,
    highLeverage,
    quickWins,
  };
}

export function assignBucketsByRank(items: RecommendationItem[]): RecommendationItem[] {
  const targets = computeBucketTargets(items.length);

  return items.map((item, index) => {
    let bucket: ActionPlanBucket;
    if (index < targets.critical) {
      bucket = 'critical';
    } else if (index < targets.critical + targets.highLeverage) {
      bucket = 'highLeverage';
    } else {
      bucket = 'quickWins';
    }

    return {
      ...item,
      bucket,
    };
  });
}
