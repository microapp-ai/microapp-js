import {SandboxAuthRepo} from "../src";

describe('SandboxAuthRepo', () => {
    describe('constructor', () => {
        it('Should not autologin if flag not passed in', async () => {
            const repo = new SandboxAuthRepo({
                    enabled: true,
                    user: { id: '1', email: 'hi@microapp.io', pictureUrl: 'https://example.com/avatar.png' },
                  });

            const isAuthenticated = await repo.isAuthenticated();
            expect(isAuthenticated).toBe(false);
        })

        it('Should autologin if flag passed in', (done) => {
            const repo = new SandboxAuthRepo({
                enabled: true,
                user: { id: '1', email: 'hi@microapp.io', pictureUrl: 'https://example.com/avatar.png' },
                autologin: true,
            });

            setTimeout(async () => {
                const isAuthenticated = await repo.isAuthenticated();
                expect(isAuthenticated).toBe(true);
                const user = await repo.getUser();
                expect(user.email).toBe('hi@microapp.io');
                done();
            }, 500);
        })

        it('Should not have authenticated user until requestLogin called', async() => {
            const repo = new SandboxAuthRepo({
                enabled: true,
                user: { id: '1', email: 'hi@microapp.io', pictureUrl: 'https://example.com/avatar.png' },
            });

            let isAuthenticated = await repo.isAuthenticated();
            expect(isAuthenticated).toBe(false);

            await expect(repo.getUser()).rejects.toThrow("Sandbox user not authenticated");

            await repo.requestLogin();

            isAuthenticated = await repo.isAuthenticated();
            expect(isAuthenticated).toBe(true);

            const user = await repo.getUser();
            expect(user.email).toBe('hi@microapp.io');
        })

    })
})