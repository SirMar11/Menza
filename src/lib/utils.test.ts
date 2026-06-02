import { getCurrentDay } from './utils';

afterEach(() => vi.useRealTimers());

it('getCurrentDay vrátí správný pracovní den', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-15')); // pondělí
  expect(getCurrentDay()).toBe('monday');
});

it('getCurrentDay vrátí monday pro víkend', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-13')); // sobota
  expect(getCurrentDay()).toBe('monday');
});
