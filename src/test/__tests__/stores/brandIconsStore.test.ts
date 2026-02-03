/**
 * Tests for src/stores/brandIconsStore.ts
 * Tests the Zustand store for brand icons and store profiles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBrandIconsStore } from '../../../stores/brandIconsStore';

describe('brandIconsStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useBrandIconsStore.setState({
      icons: [],
      profiles: [],
      activeProfileId: null,
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have empty icons array', () => {
      const { icons } = useBrandIconsStore.getState();
      expect(icons).toEqual([]);
    });

    it('should have empty profiles array', () => {
      const { profiles } = useBrandIconsStore.getState();
      expect(profiles).toEqual([]);
    });

    it('should have null activeProfileId', () => {
      const { activeProfileId } = useBrandIconsStore.getState();
      expect(activeProfileId).toBeNull();
    });
  });

  describe('Icon actions', () => {
    describe('addIcon', () => {
      it('should add a new icon', () => {
        const { addIcon } = useBrandIconsStore.getState();
        addIcon('Intel', 'data:image/png;base64,intel');

        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(1);
        expect(icons[0].name).toBe('Intel');
        expect(icons[0].image).toBe('data:image/png;base64,intel');
      });

      it('should add multiple icons', () => {
        const { addIcon } = useBrandIconsStore.getState();
        addIcon('Intel', 'data:image/png;base64,intel');
        addIcon('AMD', 'data:image/png;base64,amd');
        addIcon('NVIDIA', 'data:image/png;base64,nvidia');

        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(3);
      });

      it('should update existing icon if name matches (case-insensitive)', () => {
        const { addIcon } = useBrandIconsStore.getState();
        addIcon('Intel', 'data:image/png;base64,old');
        addIcon('intel', 'data:image/png;base64,new');

        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(1);
        expect(icons[0].image).toBe('data:image/png;base64,new');
      });

      it('should preserve original name casing when updating', () => {
        const { addIcon } = useBrandIconsStore.getState();
        addIcon('Intel', 'data:image/png;base64,old');
        addIcon('INTEL', 'data:image/png;base64,new');

        const { icons } = useBrandIconsStore.getState();
        expect(icons[0].name).toBe('Intel'); // Original casing preserved
      });
    });

    describe('removeIcon', () => {
      it('should remove icon by exact name', () => {
        useBrandIconsStore.setState({
          icons: [
            { name: 'Intel', image: 'data:image' },
            { name: 'AMD', image: 'data:image' },
          ],
          profiles: [],
          activeProfileId: null,
        });

        const { removeIcon } = useBrandIconsStore.getState();
        removeIcon('Intel');

        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(1);
        expect(icons[0].name).toBe('AMD');
      });

      it('should do nothing if icon not found', () => {
        useBrandIconsStore.setState({
          icons: [{ name: 'Intel', image: 'data:image' }],
          profiles: [],
          activeProfileId: null,
        });

        const { removeIcon } = useBrandIconsStore.getState();
        removeIcon('NonExistent');

        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(1);
      });
    });

    describe('updateIcon', () => {
      it('should update icon properties', () => {
        useBrandIconsStore.setState({
          icons: [{ name: 'Intel', image: 'data:image/old' }],
          profiles: [],
          activeProfileId: null,
        });

        const { updateIcon } = useBrandIconsStore.getState();
        updateIcon('Intel', { image: 'data:image/new' });

        const { icons } = useBrandIconsStore.getState();
        expect(icons[0].image).toBe('data:image/new');
      });

      it('should allow updating name', () => {
        useBrandIconsStore.setState({
          icons: [{ name: 'Intel', image: 'data:image' }],
          profiles: [],
          activeProfileId: null,
        });

        const { updateIcon } = useBrandIconsStore.getState();
        updateIcon('Intel', { name: 'Intel Corp' });

        const { icons } = useBrandIconsStore.getState();
        expect(icons[0].name).toBe('Intel Corp');
      });
    });

    describe('getIconByName', () => {
      it('should find icon by exact name', () => {
        useBrandIconsStore.setState({
          icons: [
            { name: 'Intel', image: 'data:image/intel' },
            { name: 'AMD', image: 'data:image/amd' },
          ],
          profiles: [],
          activeProfileId: null,
        });

        const { getIconByName } = useBrandIconsStore.getState();
        const icon = getIconByName('Intel');

        expect(icon).toBeDefined();
        expect(icon?.name).toBe('Intel');
      });

      it('should find icon case-insensitively', () => {
        useBrandIconsStore.setState({
          icons: [{ name: 'Intel', image: 'data:image' }],
          profiles: [],
          activeProfileId: null,
        });

        const { getIconByName } = useBrandIconsStore.getState();
        expect(getIconByName('intel')).toBeDefined();
        expect(getIconByName('INTEL')).toBeDefined();
        expect(getIconByName('InTeL')).toBeDefined();
      });

      it('should return undefined if not found', () => {
        const { getIconByName } = useBrandIconsStore.getState();
        expect(getIconByName('NonExistent')).toBeUndefined();
      });
    });
  });

  describe('Profile actions', () => {
    describe('addProfile', () => {
      it('should add a new profile', () => {
        const { addProfile } = useBrandIconsStore.getState();
        const profile = addProfile('My Store', 'data:image/logo', 'gaming');

        expect(profile.name).toBe('My Store');
        expect(profile.logo).toBe('data:image/logo');
        expect(profile.defaultTheme).toBe('gaming');
        expect(profile.id).toBeDefined();

        const { profiles } = useBrandIconsStore.getState();
        expect(profiles.length).toBe(1);
      });

      it('should allow null logo', () => {
        const { addProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', null, 'minimal');

        expect(profile.logo).toBeNull();
      });

      it('should generate unique IDs', () => {
        const { addProfile } = useBrandIconsStore.getState();
        const profile1 = addProfile('Store 1', null, 'gaming');
        const profile2 = addProfile('Store 2', null, 'gaming');

        expect(profile1.id).not.toBe(profile2.id);
      });
    });

    describe('updateProfile', () => {
      it('should update profile properties', () => {
        const { addProfile, updateProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Old Name', null, 'gaming');

        updateProfile(profile.id, { name: 'New Name' });

        const { profiles } = useBrandIconsStore.getState();
        expect(profiles[0].name).toBe('New Name');
      });

      it('should update multiple properties', () => {
        const { addProfile, updateProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', null, 'gaming');

        updateProfile(profile.id, {
          name: 'Updated Store',
          logo: 'data:image/new',
          defaultTheme: 'minimal',
        });

        const { profiles } = useBrandIconsStore.getState();
        expect(profiles[0].name).toBe('Updated Store');
        expect(profiles[0].logo).toBe('data:image/new');
        expect(profiles[0].defaultTheme).toBe('minimal');
      });

      it('should not modify other profiles', () => {
        const { addProfile, updateProfile } = useBrandIconsStore.getState();
        const profile1 = addProfile('Store 1', null, 'gaming');
        const profile2 = addProfile('Store 2', null, 'minimal');

        updateProfile(profile1.id, { name: 'Updated' });

        const { profiles } = useBrandIconsStore.getState();
        expect(profiles.find((p) => p.id === profile2.id)?.name).toBe('Store 2');
      });
    });

    describe('deleteProfile', () => {
      it('should delete profile by ID', () => {
        const { addProfile, deleteProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', null, 'gaming');

        deleteProfile(profile.id);

        const { profiles } = useBrandIconsStore.getState();
        expect(profiles.length).toBe(0);
      });

      it('should clear activeProfileId if deleted profile was active', () => {
        const { addProfile, setActiveProfile, deleteProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', null, 'gaming');
        setActiveProfile(profile.id);

        deleteProfile(profile.id);

        const { activeProfileId } = useBrandIconsStore.getState();
        expect(activeProfileId).toBeNull();
      });

      it('should not clear activeProfileId if different profile deleted', () => {
        const { addProfile, setActiveProfile, deleteProfile } = useBrandIconsStore.getState();
        const profile1 = addProfile('Store 1', null, 'gaming');
        const profile2 = addProfile('Store 2', null, 'minimal');
        setActiveProfile(profile1.id);

        deleteProfile(profile2.id);

        const { activeProfileId } = useBrandIconsStore.getState();
        expect(activeProfileId).toBe(profile1.id);
      });
    });

    describe('setActiveProfile', () => {
      it('should set active profile ID', () => {
        const { addProfile, setActiveProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', null, 'gaming');

        setActiveProfile(profile.id);

        const { activeProfileId } = useBrandIconsStore.getState();
        expect(activeProfileId).toBe(profile.id);
      });

      it('should allow setting to null', () => {
        const { addProfile, setActiveProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', null, 'gaming');
        setActiveProfile(profile.id);

        setActiveProfile(null);

        const { activeProfileId } = useBrandIconsStore.getState();
        expect(activeProfileId).toBeNull();
      });
    });

    describe('getActiveProfile', () => {
      it('should return active profile', () => {
        const { addProfile, setActiveProfile, getActiveProfile } = useBrandIconsStore.getState();
        const profile = addProfile('Store', 'data:logo', 'gaming');
        setActiveProfile(profile.id);

        const active = getActiveProfile();

        expect(active).toBeDefined();
        expect(active?.name).toBe('Store');
      });

      it('should return undefined if no active profile', () => {
        const { getActiveProfile } = useBrandIconsStore.getState();

        expect(getActiveProfile()).toBeUndefined();
      });

      it('should return undefined if active ID not found', () => {
        useBrandIconsStore.setState({
          icons: [],
          profiles: [],
          activeProfileId: 'non-existent',
        });

        const { getActiveProfile } = useBrandIconsStore.getState();
        expect(getActiveProfile()).toBeUndefined();
      });
    });
  });

  describe('Bulk operations', () => {
    describe('importIcons', () => {
      it('should import new icons', () => {
        const { importIcons } = useBrandIconsStore.getState();
        const count = importIcons([
          { name: 'Intel', image: 'data:image/intel' },
          { name: 'AMD', image: 'data:image/amd' },
        ]);

        expect(count).toBe(2);
        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(2);
      });

      it('should skip duplicates (case-insensitive)', () => {
        useBrandIconsStore.setState({
          icons: [{ name: 'Intel', image: 'data:image/old' }],
          profiles: [],
          activeProfileId: null,
        });

        const { importIcons } = useBrandIconsStore.getState();
        const count = importIcons([
          { name: 'intel', image: 'data:image/new' }, // Should skip
          { name: 'AMD', image: 'data:image/amd' }, // Should add
        ]);

        expect(count).toBe(1);
        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(2);
        // Original Intel should be unchanged
        expect(icons[0].image).toBe('data:image/old');
      });

      it('should return 0 for empty import', () => {
        const { importIcons } = useBrandIconsStore.getState();
        const count = importIcons([]);

        expect(count).toBe(0);
      });
    });

    describe('exportIcons', () => {
      it('should export icons as JSON string', () => {
        useBrandIconsStore.setState({
          icons: [
            { name: 'Intel', image: 'data:image/intel' },
            { name: 'AMD', image: 'data:image/amd' },
          ],
          profiles: [],
          activeProfileId: null,
        });

        const { exportIcons } = useBrandIconsStore.getState();
        const json = exportIcons();

        const parsed = JSON.parse(json);
        expect(parsed.length).toBe(2);
        expect(parsed[0].name).toBe('Intel');
      });

      it('should export empty array when no icons', () => {
        const { exportIcons } = useBrandIconsStore.getState();
        const json = exportIcons();

        expect(JSON.parse(json)).toEqual([]);
      });
    });

    describe('clearIcons', () => {
      it('should remove all icons', () => {
        useBrandIconsStore.setState({
          icons: [
            { name: 'Intel', image: 'data:image' },
            { name: 'AMD', image: 'data:image' },
          ],
          profiles: [],
          activeProfileId: null,
        });

        const { clearIcons } = useBrandIconsStore.getState();
        clearIcons();

        const { icons } = useBrandIconsStore.getState();
        expect(icons.length).toBe(0);
      });

      it('should not affect profiles', () => {
        const { addProfile, clearIcons } = useBrandIconsStore.getState();
        addProfile('Store', null, 'gaming');

        useBrandIconsStore.setState((state) => ({
          ...state,
          icons: [{ name: 'Intel', image: 'data:image' }],
        }));

        clearIcons();

        const { profiles } = useBrandIconsStore.getState();
        expect(profiles.length).toBe(1);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in brand names', () => {
      const { addIcon, getIconByName } = useBrandIconsStore.getState();
      addIcon('be quiet!', 'data:image');
      addIcon('G.Skill', 'data:image');

      expect(getIconByName('be quiet!')).toBeDefined();
      expect(getIconByName('G.Skill')).toBeDefined();
    });

    it('should handle empty string brand name', () => {
      const { addIcon } = useBrandIconsStore.getState();
      addIcon('', 'data:image');

      const { icons } = useBrandIconsStore.getState();
      expect(icons.length).toBe(1);
      expect(icons[0].name).toBe('');
    });

    it('should handle very long image data', () => {
      const { addIcon } = useBrandIconsStore.getState();
      const longImage = 'data:image/png;base64,' + 'A'.repeat(100000);
      addIcon('Test', longImage);

      const { icons } = useBrandIconsStore.getState();
      expect(icons[0].image).toBe(longImage);
    });

    it('should handle concurrent operations', () => {
      const { addIcon, removeIcon } = useBrandIconsStore.getState();

      // Add multiple icons
      addIcon('A', 'data:a');
      addIcon('B', 'data:b');
      addIcon('C', 'data:c');

      // Remove one
      removeIcon('B');

      // Add another
      addIcon('D', 'data:d');

      const { icons } = useBrandIconsStore.getState();
      const names = icons.map((i) => i.name);
      expect(names).toContain('A');
      expect(names).not.toContain('B');
      expect(names).toContain('C');
      expect(names).toContain('D');
    });
  });
});
