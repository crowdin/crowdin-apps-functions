export interface AppToken {
    accessToken: string;
    expiresIn: number;
}

export interface Token {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface JwtPayload {
    aud: string;
    sub: string;
    domain?: string;
    context: JwtPayloadContext;
    iat: number;
    exp: number;
}

export interface JwtPayloadContext {
    project_id: number;
    organization_id: number;
    user_id: number;
}

export interface InstallEvent {
    appId: string;
    appSecret: string;
    clientId: string;
    userId: number;
    organizationId: number;
    domain?: string;
    baseUrl: string;
    code: string;
}

export interface UninstallEvent {
    appId: string;
    clientId: string;
    organizationId: number;
    domain?: string;
    baseUrl: string;
}
