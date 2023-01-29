/* eslint-disable @typescript-eslint/ban-ts-ignore */
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { AppToken, JwtPayload, Token } from './models';

const crowdinAuthUrl = 'https://accounts.crowdin.com/oauth/token';

interface FetchAppTokenArgs {
    appId: string;
    appSecret: string;
    clientId: string;
    clientSecret: string;
    domain: string;
    userId: number;
    url?: string;
}

function isFetchAppTokenArgs(args: FetchAppTokenArgs | string): args is FetchAppTokenArgs {
    return typeof args !== 'string';
}

/**
 *
 * @param appId Crowdin app identifier
 * @param appSecret Crowdin app secret received from install event
 * @param clientId OAuth client id of the app
 * @param clientSecret OAuth client secret of the app
 * @param domain Crowdin organization domain
 * @param userId The user who installed the application
 * @param url Custom url for token exchange
 * @returns token object which is needed to establish communication between app and Crowdin API
 */
export async function fetchAppToken(
    appId: string,
    appSecret: string,
    clientId: string,
    clientSecret: string,
    domain: string,
    userId: number,
    url?: string,
): Promise<AppToken>;

export async function fetchAppToken(args: FetchAppTokenArgs): Promise<AppToken>;

export async function fetchAppToken(
    appIdOrArgs: string | FetchAppTokenArgs,
    appSecret?: string,
    clientId?: string,
    clientSecret?: string,
    domain?: string,
    userId?: number,
    url?: string,
): Promise<AppToken> {
    let options: FetchAppTokenArgs;
    if (isFetchAppTokenArgs(appIdOrArgs)) {
        options = appIdOrArgs;
    } else {
        //@ts-ignore
        options = { appId: appIdOrArgs, appSecret, clientId, clientSecret, domain, userId, url };
    }
    const token = await axios.post(options.url || crowdinAuthUrl, {
        grant_type: 'crowdin_app',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        app_id: options.appId,
        app_secret: options.appSecret,
        domain: options.domain,
        user_id: options.userId,
    });

    return {
        accessToken: token.data.access_token,
        expiresIn: +token.data.expires_in,
    };
}

interface GenerateOAuthTokenArgs {
    clientId: string;
    clientSecret: string;
    code: string;
    url?: string;
}

function isGenerateOAuthTokenArgs(args: GenerateOAuthTokenArgs | string): args is GenerateOAuthTokenArgs {
    return typeof args !== 'string';
}

/**
 *
 * @param clientId OAuth client id of the app
 * @param clientSecret OAuth client secret of the app
 * @param code code used for authorization of your Crowdin app (returned in install event payload)
 * @param url Custom url for token exchange
 * @returns token object which is needed to establish communication between app and Crowdin API
 */
export async function generateOAuthToken(
    clientId: string,
    clientSecret: string,
    code: string,
    url?: string,
): Promise<Token>;

export async function generateOAuthToken(args: GenerateOAuthTokenArgs): Promise<Token>;

export async function generateOAuthToken(
    clientIdOrArgs: string | GenerateOAuthTokenArgs,
    clientSecret?: string,
    code?: string,
    url?: string,
): Promise<Token> {
    let options: GenerateOAuthTokenArgs;
    if (isGenerateOAuthTokenArgs(clientIdOrArgs)) {
        options = clientIdOrArgs;
    } else {
        //@ts-ignore
        options = { clientId: clientIdOrArgs, clientSecret, code, url };
    }
    const token = await axios.post(options.url || crowdinAuthUrl, {
        grant_type: 'authorization_code',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        code: options.code,
    });
    return {
        accessToken: token.data.access_token,
        refreshToken: token.data.refresh_token,
        expiresIn: +token.data.expires_in,
    };
}

interface RefreshOAuthTokenArgs {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    url?: string;
}

function isRefreshOAuthTokenArgs(args: RefreshOAuthTokenArgs | string): args is RefreshOAuthTokenArgs {
    return typeof args !== 'string';
}

/**
 *
 * @param clientId OAuth client id of the app
 * @param clientSecret OAuth client secret of the app
 * @param refreshToken {@link Token#refreshToken}
 * @param url Custom url for token exchange
 * @returns updated token object
 */
export async function refreshOAuthToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    url?: string,
): Promise<Token>;

export async function refreshOAuthToken(args: RefreshOAuthTokenArgs): Promise<Token>;

export async function refreshOAuthToken(
    clientIdOrArgs: string | RefreshOAuthTokenArgs,
    clientSecret?: string,
    refreshToken?: string,
    url?: string,
): Promise<Token> {
    let options: RefreshOAuthTokenArgs;
    if (isRefreshOAuthTokenArgs(clientIdOrArgs)) {
        options = clientIdOrArgs;
    } else {
        //@ts-ignore
        options = { clientId: clientIdOrArgs, clientSecret, refreshToken, url };
    }
    const token = await axios.post(options.url || crowdinAuthUrl, {
        grant_type: 'refresh_token',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        refresh_token: options.refreshToken,
    });
    return {
        accessToken: token.data.access_token,
        refreshToken: token.data.refresh_token,
        expiresIn: +token.data.expires_in,
    };
}

/**
 *
 * @param jwtPayload jwt token payload
 * @returns unique identifier of crowdin user and project context
 */
export function constructCrowdinIdFromJwtPayload(jwtPayload: JwtPayload): string {
    return `${jwtPayload.domain || jwtPayload.context.organization_id}__${jwtPayload.context.project_id}__${
        jwtPayload.sub
    }`;
}

/**
 *
 * @param crowdinId crowdin id (from {@link constructCrowdinIdFromJwtPayload})
 * @returns crowdin project id
 */
export function getProjectId(crowdinId: string): number {
    return Number(crowdinId.split('__')[1]);
}

/**
 *
 * @param jwtToken jwt token which Crowdin adds to app iframe
 * @param clientSecret OAuth client secret of the app
 * @param options extra options for verification
 * @returns jwt payload
 */
export async function validateJwtToken(
    jwtToken: string,
    clientSecret: string,
    options?: VerifyOptions,
): Promise<JwtPayload> {
    return new Promise((res, rej) => {
        jwt.verify(jwtToken, clientSecret, options, (err, decoded) => {
            if (err) {
                rej(err);
            } else {
                res(decoded as JwtPayload);
            }
        });
    });
}

export interface VerifyOptions {
    ignoreExpiration: boolean;
}
