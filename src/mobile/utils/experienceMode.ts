export const EXPERIENCE_MODE_KEY = 'memotymode';

export function isExperienceMode(): boolean {
  return sessionStorage.getItem(EXPERIENCE_MODE_KEY) === 'true';
}

export function enterExperienceMode(): void {
  sessionStorage.setItem(EXPERIENCE_MODE_KEY, 'true');
}

export function exitExperienceMode(): void {
  sessionStorage.removeItem(EXPERIENCE_MODE_KEY);
  window.location.replace('/');
}
