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

  it('executes callback when the user is authenticated', async () => {
    const repo = new SandboxAuthRepo({
      enabled: true,
      user: {
        id: '1',
        email: 'hi@microapp.io',
        pictureUrl: 'https://example.com/avatar.png',
      },
    });

    const mockCallback = jest.fn();
    const unsubscribeCallback = repo.onUserAuthenticated(mockCallback);

    await repo.requestLogin();

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        email: 'hi@microapp.io',
        pictureUrl: 'https://example.com/avatar.png',
      })
    );

    unsubscribeCallback();

    await repo.requestLogin();

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
