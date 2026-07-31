/**
 * Shared FlatList tuning for long lists — keep screens consistent.
 * Chat already uses stronger settings for streaming transcripts.
 */
export const LIST_PERF = {
  initialNumToRender: 12,
  windowSize: 7,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
} as const;
