import {
  MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME,
  MICROAPP_INIT_EVENT_NAME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_URL_PARAM_NAMES,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';

export type MicroappScriptVariables = { appId: string; targetOrigin: string };
export type MicroappScriptBuilder = (
  options: MicroappScriptVariables
) => string;

const ROUTING_POLLING_INTERVAL_IN_MS = 200;

const script = minifyAndObfuscateScript(`
(function() {
  // Initialize the microapp object
  if (!window.__MICROAPP__) {
    const { theme, lang } = buildUserPreferencesFromUrl();
    window.__MICROAPP__ = {
      id: '__MICROAPP_ID__',
      hasRouting: false,
      hasResizing: false,
      hasParentAcknowledgedInit: false,
      theme,
      lang,
    };

    function buildUserPreferencesFromUrl() {
      const url = new URL(window.location.href);
      return {
        theme: url.searchParams.get('${MICROAPP_URL_PARAM_NAMES['THEME']}'),
        lang: url.searchParams.get('${MICROAPP_URL_PARAM_NAMES['LANGUAGE']}'),
      };
    }

    function sendInitUntilAcknowledge() {
      if (window.__MICROAPP__.hasParentAcknowledgedInit) {
        return;
      }
      window.parent.postMessage(
        {
          type: '${MICROAPP_INIT_EVENT_NAME}',
          payload: getCurrentData(),
        },
        '__TARGET_ORIGIN__'
      );
      setTimeout(sendInitUntilAcknowledge, 100);
    }

    window.addEventListener('message', (event) => {
      const isOriginAllowed = event.origin === '__TARGET_ORIGIN__';

      if (!isOriginAllowed) {
        return;
      }

      const isInitAcknowledgementEvent = event.data.type === '${MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME}';

      if (isInitAcknowledgementEvent) {
        window.__MICROAPP__.hasParentAcknowledgedInit = true;
        return;
      }

      const isUserPreferencesEvent = event.data.type === '${MICROAPP_USER_PREFERENCES_EVENT_NAME}';

      if (isUserPreferencesEvent) {
        const { theme, lang } = event.data.payload;
        window.__MICROAPP__.theme = theme;
        window.__MICROAPP__.lang = lang;
      }
    });

    sendInitUntilAcknowledge();
  }

  if (window.__MICROAPP__.hasRouting) {
    return;
  }

  window.__MICROAPP__.hasRouting = true;

  // Track the current URL and title
  let lastRoute = null;

  // Notify parent about route changes
  function notifyRouteChange(trigger) {
    // Only notify if URL or title has actually changed
    if (canNotifyRouteChange()) {
      lastRoute = getCurrentData();
      window.parent.postMessage(
        {
          type: '${MICROAPP_ROUTE_CHANGE_EVENT_NAME}',
          payload: { trigger, ...lastRoute }
        },
        '__TARGET_ORIGIN__'
      );
    }
  }

  function canNotifyRouteChange() {
    const { url, title } = getCurrentData();
    return lastRoute === null || lastRoute.url !== url || lastRoute.title !== title;
  }

  function getCurrentData() {
    return {
      url: window.location.href,
      title: document.title
    };
  }

  // Basic history API interception
  window.addEventListener('popstate', () => {
    notifyRouteChange('popstate');
  });

  // Override history methods
  const originalPushState = history.pushState;
  window.history.pushState = function(...args) {
    originalPushState.apply(this, args);
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => notifyRouteChange('pushState'));
  };

  const originalReplaceState = history.replaceState;
  window.history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    requestAnimationFrame(() => notifyRouteChange('replaceState'));
  };

  // Reliable URL polling fallback - the key to universal compatibility
  function pollRouteChange() {
    const currentRoute = getCurrentData();
    if (canNotifyRouteChange()) {
      lastRoute = currentRoute;
      notifyRouteChange('polling');
    }
    setTimeout(pollRouteChange, ${ROUTING_POLLING_INTERVAL_IN_MS});
  }

  setTimeout(pollRouteChange, ${ROUTING_POLLING_INTERVAL_IN_MS});
  notifyRouteChange('init');
}());`);
export function getRoutingScriptBuilder(): MicroappScriptBuilder {
  return (variables) => replaceScriptVariables(script, variables);
}

export function getResizingScriptBuilder(): MicroappScriptBuilder {
  const script = minifyAndObfuscateScript(`
(function() {
  if (window.__MICROAPP__.hasResizing) {
    return;
  }

  window.__MICROAPP__.hasResizing = true;

  function throttle(callback, delay) {
    let last;
    let timer;
    return function() {
      const context = this;
      const now = +new Date();
      const args = arguments;
      if (last && now < last + delay) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          last = now;
          callback.apply(context, args);
        }, delay);
      } else {
        last = now;
        callback.apply(context, args);
      }
    };
  }

  // NB: This is a workaround to fix the issue with the height of the iframe
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('height', 'auto', 'important');
  document.documentElement.style.setProperty('height', 'auto', 'important');
  document.documentElement.style.setProperty('overflow', 'auto', 'important');
  const next = document.getElementById('__next');
  if (next) {
    next.style.setProperty('height', 'auto', 'important');
    next.style.setProperty('overflow', 'auto', 'important');
  }

  const notifyHeightChange = throttle((trigger) => {
    const bodyRect = document.body.getBoundingClientRect();
    const widthInPixel = bodyRect.width;
    const heightInPixel = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    window.parent.postMessage({
      type: '${MICROAPP_RESIZE_EVENT_NAME}',
      payload: { trigger, widthInPixel, heightInPixel }
    }, '__TARGET_ORIGIN__');
  }, 500);

  window.addEventListener('load', () => {
    ['resize', 'orientationchange', 'fullscreenchange'].forEach(eventName => {
      window.addEventListener(eventName, () => {
        notifyHeightChange(eventName);
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      notifyHeightChange('resizeObserver');
    });
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(() => {
      notifyHeightChange('mutationObserver');
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    notifyHeightChange('load');
  });
}())`);

  return (variables) => replaceScriptVariables(script, variables);
}

function minifyAndObfuscateScript(script: string): string {
  // Transformers array
  const transformers = [
    preserveStrings,
    removeComments,
    removeBlankLines,
    removeAllWhitespace,
    restoreStrings,
  ];

  // String literals storage
  const stringLiterals: string[] = [];

  // Transformer 1: Preserve string literals
  function preserveStrings(script: string): string {
    return script.replace(/(["'])((?:\\[\s\S]|(?!\1)[^\\])*)\1/g, (match) => {
      stringLiterals.push(match);
      return `__STRING_${stringLiterals.length - 1}__`;
    });
  }

  // Transformer 2: Remove comments
  function removeComments(script: string): string {
    return script
      .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
      .replace(/\/\/.*/g, ''); // Single-line comments
  }

  // Transformer 3: Remove blank lines
  function removeBlankLines(script: string): string {
    return script.replace(/^\s*[\r\n]/gm, '');
  }

  // Transformer 4: Remove ALL whitespace (not just collapse)
  function removeAllWhitespace(script: string): string {
    return script.replace(/\s+/g, ' ');
  }

  // Transformer 5: Restore preserved strings
  function restoreStrings(script: string): string {
    return script.replace(/__STRING_(\d+)__/g, (_, index) => {
      return stringLiterals[parseInt(index)];
    });
  }

  // Apply transformers in sequence using reducer pattern
  return transformers.reduce(
    (result, transformer) => transformer(result),
    script
  );
}

function replaceScriptVariables(
  script: string,
  variables: MicroappScriptVariables
): string {
  return script
    .replace(/__MICROAPP_ID__/g, variables.appId)
    .replace(/__TARGET_ORIGIN__/g, variables.targetOrigin);
}
