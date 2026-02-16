export interface AppVersion {
    version_name: string;
    download_url: string;
    changelog: string;
    is_critical: boolean;
    publish_at: string;
}

const GITHUB_REPO = 'dwm97317/hedui';

export const updateService = {
    /**
     * Check for the latest version from GitHub Releases
     */
    async getLatestVersion(): Promise<{ success: boolean; data: AppVersion | null; error: string | null }> {
        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { success: true, data: null, error: 'No releases found' };
                }
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const release = await response.json();

            // Find APK asset
            const apkAsset = release.assets.find((asset: any) => asset.name.endsWith('.apk'));

            if (!apkAsset) {
                return { success: true, data: null, error: 'No APK found in the latest release' };
            }

            return {
                success: true,
                data: {
                    version_name: release.tag_name,
                    download_url: apkAsset.browser_download_url,
                    changelog: release.body,
                    is_critical: release.body.includes('[critical]'),
                    publish_at: release.published_at
                },
                error: null
            };
        } catch (err: any) {
            console.error('Update Check Error:', err);
            return { success: false, data: null, error: err.message };
        }
    }
};
