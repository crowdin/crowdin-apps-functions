import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { JwtPayload, Token } from './models';

const crowdinAuthUrl = 'https://accounts.crowdin.com/oauth/token';

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

export function constructClientIdFromJwtPayload(jwtPayload: JwtPayload): string {
    return `${jwtPayload.domain || jwtPayload.context.organization_id}__${jwtPayload.context.project_id}__${
        jwtPayload.sub
    }`;
}

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
