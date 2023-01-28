import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { AppToken, JwtPayload, Token } from './models';

const crowdinAuthUrl = 'https://accounts.crowdin.com/oauth/token';

/**
 *
 * @param arguments arguments
 * @param arguments.appId Crowdin app identifier
 * @param arguments.appSecret Crowdin app secret received from install event
 * @param arguments.clientId OAuth client id of the app
 * @param arguments.clientSecret OAuth client secret of the app
 * @param arguments.domain Crowdin organization domain
 * @param arguments.userId The user who installed the application
 * @param arguments.url Custom url for token exchange
 * @returns token object which is needed to establish communication between app and Crowdin API
 */
export async function fetchAppToken({
    appId,
    appSecret,
    clientId,
    clientSecret,
    domain,
    userId,
    url,
}: {
    appId: string;
    appSecret: string;
    clientId: string;
    clientSecret: string;
    domain: string;
    userId: number;
    url?: string;
}): Promise<AppToken> {
    const token = await axios.post(url || crowdinAuthUrl, {
        grant_type: 'crowdin_app',
        client_id: clientId,
        client_secret: clientSecret,
        app_id: appId,
        app_secret: appSecret,
        domain: domain,
        user_id: userId,
    });

    return {
        accessToken: token.data.access_token,
        expiresIn: +token.data.expires_in,
    };
}

/**
 *
 * @param arguments arguments
 * @param arguments.clientId OAuth client id of the app
 * @param arguments.clientSecret OAuth client secret of the app
 * @param arguments.code code used for authorization of your Crowdin app (returned in install event payload)
 * @param arguments.url Custom url for token exchange
 * @returns token object which is needed to establish communication between app and Crowdin API
 */
export async function generateOAuthToken({
    clientId,
    clientSecret,
    code,
    url,
}: {
    clientId: string;
    clientSecret: string;
    code: string;
    url?: string;
}): Promise<Token> {
    const token = await axios.post(url || crowdinAuthUrl, {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
    });
    return {
        accessToken: token.data.access_token,
        refreshToken: token.data.refresh_token,
        expiresIn: +token.data.expires_in,
    };
}

/**
 *
 * @param arguments arguments
 * @param arguments.clientId OAuth client id of the app
 * @param arguments.clientSecret OAuth client secret of the app
 * @param arguments.refreshToken {@link Token#refreshToken}
 * @param arguments.url Custom url for token exchange
 * @returns updated token object
 */
export async function refreshOAuthToken({
    clientId,
    clientSecret,
    refreshToken,
    url,
}: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    url?: string;
}): Promise<Token> {
    const token = await axios.post(url || crowdinAuthUrl, {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
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
