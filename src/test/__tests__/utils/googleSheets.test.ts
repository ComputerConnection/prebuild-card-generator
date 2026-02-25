/**
 * Tests for src/utils/googleSheets.ts
 *
 * Covers: extractSheetId, buildSheetCsvUrl, parseCSV, parseSheetData, exportToCSV
 */

import { describe, it, expect } from 'vitest';
import {
  extractSheetId,
  buildSheetCsvUrl,
  parseCSV,
  parseSheetData,
  exportToCSV,
} from '../../../utils/googleSheets';
import type { PrebuildConfig } from '../../../types';
import { defaultConfig } from '../../../data/componentOptions';

// ============================================================================
// extractSheetId
// ============================================================================

describe('extractSheetId', () => {
  it('should extract ID from full spreadsheets URL', () => {
    expect(
      extractSheetId('https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmN/edit')
    ).toBe('1aBcDeFgHiJkLmN');
  });

  it('should extract ID from short /d/ URL', () => {
    expect(extractSheetId('https://docs.google.com/d/abc123xyz')).toBe('abc123xyz');
  });

  it('should accept raw sheet ID', () => {
    expect(extractSheetId('1aBcDeFgHiJkLmN')).toBe('1aBcDeFgHiJkLmN');
  });

  it('should handle IDs with hyphens and underscores', () => {
    expect(extractSheetId('abc-123_XYZ')).toBe('abc-123_XYZ');
  });

  it('should return null for invalid URL', () => {
    expect(extractSheetId('')).toBeNull();
    expect(extractSheetId('not a url at all!!')).toBeNull();
  });
});

// ============================================================================
// buildSheetCsvUrl
// ============================================================================

describe('buildSheetCsvUrl', () => {
  it('should build CSV URL with default gid', () => {
    const url = buildSheetCsvUrl('abc123');
    expect(url).toBe('https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=0');
  });

  it('should build CSV URL with custom gid', () => {
    const url = buildSheetCsvUrl('abc123', '12345');
    expect(url).toBe('https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=12345');
  });
});

// ============================================================================
// parseCSV
// ============================================================================

describe('parseCSV', () => {
  it('should parse simple CSV', () => {
    const csv = 'a,b,c\n1,2,3';
    expect(parseCSV(csv)).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('should handle quoted fields', () => {
    const csv = '"hello, world",b,c';
    const rows = parseCSV(csv);
    expect(rows[0][0]).toBe('hello, world');
  });

  it('should handle escaped quotes inside quoted fields', () => {
    const csv = '"he said ""hi""",b,c';
    const rows = parseCSV(csv);
    expect(rows[0][0]).toBe('he said "hi"');
  });

  it('should handle CRLF line endings', () => {
    const csv = 'a,b\r\n1,2';
    expect(parseCSV(csv)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('should skip empty rows', () => {
    const csv = 'a,b\n\n1,2\n\n';
    expect(parseCSV(csv)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('should handle single row', () => {
    const csv = 'a,b,c';
    expect(parseCSV(csv)).toEqual([['a', 'b', 'c']]);
  });

  it('should handle empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('should trim cell whitespace', () => {
    const csv = ' a , b , c ';
    expect(parseCSV(csv)).toEqual([['a', 'b', 'c']]);
  });
});

// ============================================================================
// parseSheetData
// ============================================================================

describe('parseSheetData', () => {
  it('should return empty array for less than 2 rows', () => {
    expect(parseSheetData([['Model', 'Price']])).toEqual([]);
    expect(parseSheetData([])).toEqual([]);
  });

  it('should parse basic build data', () => {
    const rows = [
      ['Model Name', 'Price', 'CPU', 'GPU'],
      ['Gaming PC', '1499.99', 'Intel i7', 'RTX 4070'],
    ];
    const builds = parseSheetData(rows);
    expect(builds).toHaveLength(1);
    expect(builds[0].modelName).toBe('Gaming PC');
    expect(builds[0].price).toBe(1499.99);
    expect(builds[0].components?.cpu).toBe('Intel i7');
    expect(builds[0].components?.gpu).toBe('RTX 4070');
  });

  it('should handle header aliases', () => {
    const rows = [
      ['name', 'processor', 'graphics card', 'memory', 'drive', 'mobo', 'power supply', 'chassis', 'cooler'],
      ['PC', 'i7', 'RTX 4070', '32GB', '1TB', 'Z790', '850W', 'H7', 'NH-D15'],
    ];
    const builds = parseSheetData(rows);
    expect(builds).toHaveLength(1);
    expect(builds[0].components?.cpu).toBe('i7');
    expect(builds[0].components?.gpu).toBe('RTX 4070');
    expect(builds[0].components?.ram).toBe('32GB');
    expect(builds[0].components?.storage).toBe('1TB');
    expect(builds[0].components?.motherboard).toBe('Z790');
    expect(builds[0].components?.psu).toBe('850W');
    expect(builds[0].components?.case).toBe('H7');
    expect(builds[0].components?.cooling).toBe('NH-D15');
  });

  it('should map condition values', () => {
    const rows = [
      ['Model', 'Condition'],
      ['PC1', 'new'],
      ['PC2', 'pre-owned'],
      ['PC3', 'refurbished'],
      ['PC4', 'open box'],
      ['PC5', 'certified pre-owned'],
    ];
    const builds = parseSheetData(rows);
    expect(builds[0].condition).toBe('new');
    expect(builds[1].condition).toBe('preowned');
    expect(builds[2].condition).toBe('refurbished');
    expect(builds[3].condition).toBe('open_box');
    expect(builds[4].condition).toBe('certified_preowned');
  });

  it('should map stock status values', () => {
    const rows = [
      ['Model', 'Stock Status'],
      ['PC1', 'in stock'],
      ['PC2', 'low stock'],
      ['PC3', 'out of stock'],
      ['PC4', 'on order'],
    ];
    const builds = parseSheetData(rows);
    expect(builds[0].stockStatus).toBe('in_stock');
    expect(builds[1].stockStatus).toBe('low_stock');
    expect(builds[2].stockStatus).toBe('out_of_stock');
    expect(builds[3].stockStatus).toBe('on_order');
  });

  it('should skip rows with no meaningful data', () => {
    const rows = [
      ['Model', 'Price'],
      ['', ''],
      ['Gaming PC', '999'],
    ];
    const builds = parseSheetData(rows);
    expect(builds).toHaveLength(1);
    expect(builds[0].modelName).toBe('Gaming PC');
  });

  it('should handle multiple builds', () => {
    const rows = [
      ['Model', 'Price'],
      ['PC 1', '999'],
      ['PC 2', '1499'],
      ['PC 3', '1999'],
    ];
    const builds = parseSheetData(rows);
    expect(builds).toHaveLength(3);
  });
});

// ============================================================================
// exportToCSV
// ============================================================================

describe('exportToCSV', () => {
  const createBuild = (overrides: Partial<PrebuildConfig> = {}): PrebuildConfig => ({
    ...defaultConfig,
    modelName: 'Test PC',
    price: 999,
    ...overrides,
  });

  it('should include headers row', () => {
    const csv = exportToCSV([]);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Model Name');
    expect(lines[0]).toContain('Price');
    expect(lines[0]).toContain('CPU');
  });

  it('should export build data', () => {
    const csv = exportToCSV([createBuild()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Test PC');
  });

  it('should escape commas in cell values', () => {
    const csv = exportToCSV([createBuild({ modelName: 'PC, Deluxe Edition' })]);
    expect(csv).toContain('"PC, Deluxe Edition"');
  });

  it('should escape quotes in cell values', () => {
    const csv = exportToCSV([createBuild({ modelName: 'The "Best" PC' })]);
    expect(csv).toContain('"The ""Best"" PC"');
  });

  it('should prevent formula injection', () => {
    const csv = exportToCSV([createBuild({ modelName: '=IMPORTDATA("evil")' })]);
    // The value should be prefixed with apostrophe to prevent formula execution
    expect(csv).toContain("'=IMPORTDATA");
  });

  it('should handle empty builds array', () => {
    const csv = exportToCSV([]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // Just headers
  });
});
