/**
 * @description
 * The plugin can be configured using the following options:
 */
export interface PluginInitOptions {
    exampleOption?: string;
    adminApiUrl?: string;
    adminUsername?: string;
    adminPassword?: string;
    authToken?: string;
}

export const ADMIN_USER_REMOTE = "superadmin"
export const ADMIN_PASS_REMOTE = "superadmin"
export const ADMIN_USER_LOCAL = "superadmin"
export const ADMIN_PASS_LOCAL = "superadmin"
export const API_REMOTE_INSTANCE = "http://www.megastore.sn:3000/admin-api"
export const API_LOCAL_INSTANCE = "http://localhost:3000/admin-api"
