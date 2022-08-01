import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { AppToken, JwtPayload, Token } from './models';

const crowdinAuthUrl = 'https://accounts.crowdin.com/oauth/token';

/**
 *
 * @param appId Crowdin app identifier
 * @param appSecret Crowdin app secret received from install event
 * @param clientId OAuth client id of the app
 * @param clientSecret OAuth client secret of the app
 * @param domain Crowdin organization domain
 * @param userId The user who installed the application
 * @returns token object which is needed to establish communication between app and Crowdin API
 */
export async function fetchAppToken(
    appId: string,
    appSecret: string,
    clientId: string,
    clientSecret: string,
    domain: string,
    userId: number,
): Promise<AppToken> {
    const token = await axios.post(crowdinAuthUrl, {
        grant_type: 'crowdin_app',
        client_id: clientId,
        client_secret: clientSecret,
        app_id: appId,
        app_secret: appSecret,
        domain: domain,
        userId: userId,
    });

    return {
        accessToken: token.data.access_token,
        expiresIn: +token.data.expires_in,
    };
}

/**
 *
 * @param clientId OAuth client id of the app
 * @param clientSecret OAuth client secret of the app
 * @param code code used for authorization of your Crowdin app (returned in install event payload)
 * @returns token object which is needed to establish communication between app and Crowdin API
 */
export async function generateOAuthToken(clientId: string, clientSecret: string, code: string): Promise<Token> {
    const token = await axios.post(crowdinAuthUrl, {
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
 * @param clientId OAuth client id of the app
 * @param clientSecret OAuth client secret of the app
 * @param refreshToken {@link Token#refreshToken}
 * @returns updated token object
 */
export async function refreshOAuthToken(clientId: string, clientSecret: string, refreshToken: string): Promise<Token> {
    const token = await axios.post(crowdinAuthUrl, {
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
 * @returns
 */
export async function validateJwtToken(jwtToken: string, clientSecret: string): Promise<JwtPayload> {
    return new Promise((res, rej) => {
        jwt.verify(jwtToken, clientSecret, (err, decoded) => {
            if (err) {
                rej(err);
            } else {
                res(decoded as JwtPayload);
            }
        });
    });
}
