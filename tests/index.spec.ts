import { constructClientIdFromJwtPayload, JwtPayload } from '../src';

//TODO add more tests
describe('Token-based functions', () => {
    const jwtPayload: JwtPayload = {
        aud: 'test',
        sub: 'test',
        iat: 1,
        exp: 1,
        context: {
            organization_id: 1,
            project_id: 2,
            user_id: 3,
        },
    };

    it('constructClientIdFromJwtPayload', () => {
        expect(constructClientIdFromJwtPayload(jwtPayload)).toBeDefined();
    });
});
