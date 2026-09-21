export function elapsed(checkIn: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remaining = minutes % 60;
  return `${days ? `${days}d ` : ''}${hours}h ${remaining}m`;
}