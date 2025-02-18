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
    module?: string;
    context: JwtPayloadContext;
    iat: number;
    exp: number;
}

export interface JwtPayloadContext {
    project_id: number;
    project_identifier?: string;
    organization_id: number;
    organization_domain?: string;
    user_id: number;
    user_login?: string;
}

export interface InstallEvent {
    appId: string;
    appSecret: string;
    clientId: string;
    userId: number;
    agentId?: number;
    organizationId: number;
    domain?: string;
    baseUrl: string;
    code?: string;
}

export interface UninstallEvent {
    appId: string;
    appSecret: string;
    clientId: string;
    organizationId: number;
    domain?: string;
    baseUrl: string;
}
