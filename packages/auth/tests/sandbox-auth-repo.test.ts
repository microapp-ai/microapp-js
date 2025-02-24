import { SandboxAuthRepo } from '../src';

describe('SandboxAuthRepo', () => {
  it('does not authenticate user until requestLogin called', async () => {
    const repo = new SandboxAuthRepo({
      enabled: true,
      user: {
        id: '1',
        email: 'hi@microapp.io',
        pictureUrl: 'https://example.com/avatar.png',
      },
    });

    let isAuthenticated = await repo.isAuthenticated();
    expect(isAuthenticated).toBe(false);

    await expect(repo.getUser()).rejects.toThrow(
      'Could not get auth user'
    );

    await repo.requestLogin();

    isAuthenticated = await repo.isAuthenticated();
    expect(isAuthenticated).toBe(true);

    const user = await repo.getUser();
    expect(user.email).toBe('hi@microapp.io');
  });
});
