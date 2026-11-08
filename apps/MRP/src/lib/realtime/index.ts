// =============================================================================
// L-ERP MRP - REALTIME MODULE INDEX
// Export all real-time related functionality
// =============================================================================

// Event types and utilities
export * from './events';

// Socket hook
export * from './use-socket';

// Event simulator (for development/demo)
export { eventSimulator } from './simulator';

// Note: Components are in /components/realtime/
// Import them directly from there:
// import { NotificationCenter } from '@/components/realtime/notification-center';
// import { LiveActivityFeed } from '@/components/realtime/live-activity-feed';
// import { RealTimeStats } from '@/components/realtime/realtime-stats';
