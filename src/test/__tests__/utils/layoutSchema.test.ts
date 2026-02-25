/**
 * Tests for src/utils/layoutSchema.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ElementIdGenerator,
  generateElementId,
  resetElementIdCounter,
  hexToRgb,
  lightenColor,
  darkenColor,
} from '../../../utils/layoutSchema';

describe('ElementIdGenerator', () => {
  let generator: ElementIdGenerator;

  beforeEach(() => {
    generator = new ElementIdGenerator();
  });

  describe('generate', () => {
    it('should produce unique IDs with the given prefix', () => {
      const id1 = generator.generate('header');
      const id2 = generator.generate('header');
      const id3 = generator.generate('header');

      expect(id1).toBe('header-1');
      expect(id2).toBe('header-2');
      expect(id3).toBe('header-3');
    });

    it('should work with different prefixes and maintain a single counter', () => {
      const id1 = generator.generate('header');
      const id2 = generator.generate('text');
      const id3 = generator.generate('badge');

      expect(id1).toBe('header-1');
      expect(id2).toBe('text-2');
      expect(id3).toBe('badge-3');
    });
  });

  describe('reset', () => {
    it('should restart the counter', () => {
      generator.generate('item');
      generator.generate('item');
      generator.generate('item');

      generator.reset();

      const id = generator.generate('item');
      expect(id).toBe('item-1');
    });

    it('should allow generating IDs again after reset', () => {
      generator.generate('el');
      generator.generate('el');
      generator.reset();

      const id1 = generator.generate('el');
      const id2 = generator.generate('el');
      expect(id1).toBe('el-1');
      expect(id2).toBe('el-2');
    });
  });

  describe('multiple instances', () => {
    it('should have independent counters', () => {
      const generatorA = new ElementIdGenerator();
      const generatorB = new ElementIdGenerator();

      const idA1 = generatorA.generate('a');
      const idA2 = generatorA.generate('a');
      const idB1 = generatorB.generate('b');

      expect(idA1).toBe('a-1');
      expect(idA2).toBe('a-2');
      expect(idB1).toBe('b-1');
    });

    it('should not affect each other when one is reset', () => {
      const generatorA = new ElementIdGenerator();
      const generatorB = new ElementIdGenerator();

      generatorA.generate('x');
      generatorA.generate('x');
      generatorB.generate('y');
      generatorB.generate('y');
      generatorB.generate('y');

      generatorA.reset();

      expect(generatorA.generate('x')).toBe('x-1');
      expect(generatorB.generate('y')).toBe('y-4');
    });
  });
});

describe('generateElementId', () => {
  beforeEach(() => {
    resetElementIdCounter();
  });

  it('should generate IDs using the default generator', () => {
    const id1 = generateElementId('header');
    const id2 = generateElementId('text');

    expect(id1).toBe('header-1');
    expect(id2).toBe('text-2');
  });

  it('should produce incrementing IDs across calls', () => {
    const ids = Array.from({ length: 5 }, () => generateElementId('el'));

    expect(ids).toEqual(['el-1', 'el-2', 'el-3', 'el-4', 'el-5']);
  });
});

describe('resetElementIdCounter', () => {
  it('should reset the default generator counter', () => {
    generateElementId('item');
    generateElementId('item');
    generateElementId('item');

    resetElementIdCounter();

    const id = generateElementId('item');
    expect(id).toBe('item-1');
  });
});

describe('hexToRgb', () => {
  it('should parse hex color with # prefix', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('should parse hex color without # prefix', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });

  it('should parse black', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('should parse white', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });

  it('should parse green', () => {
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
  });

  it('should parse blue', () => {
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('should return [0, 0, 0] for invalid hex', () => {
    expect(hexToRgb('invalid')).toEqual([0, 0, 0]);
    expect(hexToRgb('')).toEqual([0, 0, 0]);
    expect(hexToRgb('#fff')).toEqual([0, 0, 0]);
    expect(hexToRgb('xyz123')).toEqual([0, 0, 0]);
  });

  it('should handle uppercase hex values', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#ABCDEF')).toEqual([171, 205, 239]);
  });

  it('should handle mixed case hex values', () => {
    expect(hexToRgb('#aAbBcC')).toEqual([170, 187, 204]);
  });
});

describe('lightenColor', () => {
  it('should lighten black by 50% to approximately #808080', () => {
    const result = lightenColor('#000000', 0.5);
    expect(result).toBe('#808080');
  });

  it('should return the original color when lightened by 0%', () => {
    const result = lightenColor('#336699', 0);
    expect(result).toBe('#336699');
  });

  it('should return white when lightened by 100%', () => {
    const result = lightenColor('#000000', 1);
    expect(result).toBe('#ffffff');
  });

  it('should return white when any color is lightened by 100%', () => {
    expect(lightenColor('#ff0000', 1)).toBe('#ffffff');
    expect(lightenColor('#336699', 1)).toBe('#ffffff');
    expect(lightenColor('#abcdef', 1)).toBe('#ffffff');
  });

  it('should keep white unchanged regardless of percentage', () => {
    expect(lightenColor('#ffffff', 0)).toBe('#ffffff');
    expect(lightenColor('#ffffff', 0.5)).toBe('#ffffff');
    expect(lightenColor('#ffffff', 1)).toBe('#ffffff');
  });

  it('should partially lighten a color', () => {
    const result = lightenColor('#ff0000', 0.5);
    // R: 255 + (255 - 255) * 0.5 = 255
    // G: 0 + (255 - 0) * 0.5 = 128
    // B: 0 + (255 - 0) * 0.5 = 128
    expect(result).toBe('#ff8080');
  });
});

describe('darkenColor', () => {
  it('should darken white by 50% to approximately #808080', () => {
    const result = darkenColor('#ffffff', 0.5);
    expect(result).toBe('#808080');
  });

  it('should return the original color when darkened by 0%', () => {
    const result = darkenColor('#336699', 0);
    expect(result).toBe('#336699');
  });

  it('should return black when darkened by 100%', () => {
    const result = darkenColor('#ffffff', 1);
    expect(result).toBe('#000000');
  });

  it('should return black when any color is darkened by 100%', () => {
    expect(darkenColor('#ff0000', 1)).toBe('#000000');
    expect(darkenColor('#336699', 1)).toBe('#000000');
    expect(darkenColor('#abcdef', 1)).toBe('#000000');
  });

  it('should keep black unchanged regardless of percentage', () => {
    expect(darkenColor('#000000', 0)).toBe('#000000');
    expect(darkenColor('#000000', 0.5)).toBe('#000000');
    expect(darkenColor('#000000', 1)).toBe('#000000');
  });

  it('should partially darken a color', () => {
    const result = darkenColor('#ff8080', 0.5);
    // R: 255 * (1 - 0.5) = 128
    // G: 128 * (1 - 0.5) = 64
    // B: 128 * (1 - 0.5) = 64
    expect(result).toBe('#804040');
  });
});
