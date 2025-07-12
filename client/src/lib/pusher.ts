import Pusher from 'pusher-js';

// Initialize Pusher client
export const pusher = new Pusher('d4b6f6b7c6b0e4e8c7a2', {
  cluster: 'us2',
  forceTLS: true,
});

// Export channels for different event types
export const getEventChannel = (eventId: number) => {
  return pusher.subscribe(`event-${eventId}`);
};

export const getUserChannel = (userId: string) => {
  return pusher.subscribe(`user-${userId}`);
};

export const getGlobalChannel = () => {
  return pusher.subscribe('global');
};

export default pusher;