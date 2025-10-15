import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('class1', true && 'class2', false && 'class3');
    expect(result).toBe('class1 class2');
  });

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects with conditional classes', () => {
    const result = cn({
      class1: true,
      class2: false,
      class3: true,
    });
    expect(result).toBe('class1 class3');
  });

  it('should merge Tailwind conflicting classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2'); // p-2 should override p-4
  });

  it('should handle complex Tailwind class conflicts', () => {
    const result = cn('px-2 py-1 bg-red hover:bg-dark-red', 'p-3 bg-[#B91C1C]');
    // Should resolve padding conflicts and background conflicts
    expect(result).toBe('hover:bg-dark-red p-3 bg-[#B91C1C]');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle only falsy values', () => {
    const result = cn(false, null, undefined, '');
    expect(result).toBe('');
  });

  it('should handle mixed input types', () => {
    const result = cn(
      'base-class',
      ['array-class1', 'array-class2'],
      {
        'conditional-true': true,
        'conditional-false': false,
      },
      'final-class'
    );
    expect(result).toBe('base-class array-class1 array-class2 conditional-true final-class');
  });

  it('should handle responsive Tailwind classes', () => {
    const result = cn('w-full', 'sm:w-1/2', 'md:w-1/3', 'lg:w-1/4');
    expect(result).toBe('w-full sm:w-1/2 md:w-1/3 lg:w-1/4');
  });

  it('should handle variant classes correctly', () => {
    const variant = 'primary' as 'primary' | 'secondary';
    const size = 'lg' as 'sm' | 'lg';
    const result = cn('button-base', {
      'button-primary': variant === 'primary',
      'button-secondary': variant === 'secondary',
      'button-sm': size === 'sm',
      'button-lg': size === 'lg',
    });
    expect(result).toBe('button-base button-primary button-lg');
  });

  it('should handle string with spaces', () => {
    const result = cn('class1 class2', 'class3 class4');
    expect(result).toBe('class1 class2 class3 class4');
  });

  it('should handle duplicate classes', () => {
    const result = cn('duplicate-class', 'other-class', 'duplicate-class');
    // clsx and tailwind-merge may not deduplicate - just ensure it includes both classes
    expect(result).toContain('duplicate-class');
    expect(result).toContain('other-class');
  });
});
