/**
 * StoreBrandingForm - Store name, logo, and profile management
 */

import { useRef, useState, useEffect } from 'react';
import { useConfigStore, useBrandIconsStore } from '../../stores';
import type { StoreProfile } from '../../types';
import { THEME_PRESETS } from '../../types';

export function StoreBrandingForm() {
  const { config, setConfig } = useConfigStore();
  const { profiles, activeProfileId, addProfile, deleteProfile, setActiveProfile } =
    useBrandIconsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local copy for backwards compatibility with localStorage-based profiles
  const [legacyProfiles, setLegacyProfiles] = useState<StoreProfile[]>([]);

  // Load legacy profiles on mount
  useEffect(() => {
    const stored = localStorage.getItem('prebuild-card-store-profiles');
    if (stored) {
      try {
        setLegacyProfiles(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Merge legacy and store profiles
  const allProfiles = [...legacyProfiles, ...profiles];

  const handleSaveStoreProfile = () => {
    if (!config.storeName.trim()) {
      alert('Please enter a store name first');
      return;
    }
    const profile = addProfile(config.storeName, config.storeLogo, config.colorTheme);
    setActiveProfile(profile.id);
  };

  const handleLoadStoreProfile = (profileId: string) => {
    const profile = allProfiles.find((p) => p.id === profileId);
    if (profile) {
      setConfig({
        storeName: profile.name,
        storeLogo: profile.logo,
        colorTheme: profile.defaultTheme,
        customColors:
          profile.defaultTheme === 'custom'
            ? config.customColors
            : THEME_PRESETS[profile.defaultTheme],
      });
      setActiveProfile(profileId);
    }
  };

  const handleDeleteStoreProfile = (profileId: string) => {
    // Check if it's a legacy profile
    const isLegacy = legacyProfiles.some((p) => p.id === profileId);
    if (isLegacy) {
      const updated = legacyProfiles.filter((p) => p.id !== profileId);
      setLegacyProfiles(updated);
      localStorage.setItem('prebuild-card-store-profiles', JSON.stringify(updated));
    } else {
      deleteProfile(profileId);
    }
    if (activeProfileId === profileId) {
      setActiveProfile(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig({ storeLogo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setConfig({ storeLogo: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Store Branding</h2>

      {/* Store Profiles */}
      {allProfiles.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Saved Store Profiles
          </label>
          <div className="flex flex-wrap gap-2">
            {allProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md border-2 ${
                  activeProfileId === profile.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={() => handleLoadStoreProfile(profile.id)}
                  className="text-sm font-medium"
                >
                  {profile.name}
                </button>
                <button
                  onClick={() => handleDeleteStoreProfile(profile.id)}
                  className="text-gray-400 hover:text-red-500 ml-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => setConfig({ storeName: e.target.value })}
              placeholder="Your Store Name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSaveStoreProfile}
              className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
              title="Save as store profile"
            >
              Save
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {config.storeLogo ? (
              <div className="flex items-center gap-2">
                <img
                  src={config.storeLogo}
                  alt="Store logo"
                  className="h-10 w-auto object-contain"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
              >
                Upload Logo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
