export interface AppVersion {
    version_name: string;
    download_url: string;
    changelog: string;
    is_critical: boolean;
    publish_at: string;
}

// The URL of your version manifest file
// Must use absolute HTTPS URL for APK environment
const UPDATE_CONFIG_URL = 'https://hedui.itaoth.com/uploads/update.json';

export const updateService = {
    /**
     * Check for the latest version from your own server manifest
     */
    async getLatestVersion(): Promise<{ success: boolean; data: AppVersion | null; error: string | null }> {
        try {
            // Add a timestamp to bypass cache
            const response = await fetch(`${UPDATE_CONFIG_URL}?t=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const config = await response.json();

            return {
                success: true,
                data: {
                    version_name: config.version,
                    download_url: config.url.replace('http://', 'https://'),
                    changelog: config.changelog,
                    is_critical: config.isCritical || false,
                    publish_at: config.publishAt || ''
                },
                error: null
            };
        } catch (err: any) {
            console.error('Update Check Error:', err);
            return { success: false, data: null, error: err.message };
        }
    }
};
