import { getMicroappIframeElement } from './utils';

export class MicroappRouteState {
  readonly homeUrl: string;
  readonly path: string;

  static fromEvent(event: Event): MicroappRouteState | null {
    if (!this.doesEventContainMicroappRouteState(event)) {
      return null;
    }

    return new MicroappRouteState(event.state);
  }

  private static doesEventContainMicroappRouteState(
    event: Event
  ): event is PopStateEvent {
    return (
      event instanceof PopStateEvent &&
      'homeUrl' in event.state &&
      typeof event.state.homeUrl === 'string' &&
      'path' in event.state &&
      typeof event.state.path === 'string'
    );
  }

  constructor({ homeUrl, path }: MicroappRouteStateOptions) {
    this.homeUrl = homeUrl;
    this.path = path;
  }

  reloadOnPopStateEventIfIframeIsNotVisible(event: Event): void {
    if (!MicroappRouteState.doesEventContainMicroappRouteState(event)) {
      return;
    }

    const iframe = getMicroappIframeElement({
      homeUrl: this.homeUrl,
    });

    if (!iframe) {
      window.location.reload();
    }
  }
}

export type MicroappRouteStateOptions = {
  homeUrl: string;
  path: string;
};
