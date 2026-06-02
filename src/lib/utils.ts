export function getCurrentDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[new Date().getDay()];
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day) ? day : 'monday';
}
