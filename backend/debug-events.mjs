const recentEvents = [];

export function recordEvent(type, data = {}) {
  recentEvents.unshift({
    type,
    at: new Date().toISOString(),
    ...data,
  });
  recentEvents.splice(80);
}

export function getRecentEvents() {
  return recentEvents;
}
