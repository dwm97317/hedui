/**
 * API Configuration
 */
export const API_CONFIG = {
    // MinIO-Plus API Address (Default to the server IP I just set up)
    // In production, this should be a domain name
    MINIO_PLUS_HOST: import.meta.env.VITE_MINIO_PLUS_API || `http://${window.location.hostname}:29010`,
};
