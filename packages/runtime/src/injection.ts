import {
  MICROAPP_POP_STATE_EVENT_NAME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
} from './constants';

export type MicroappScriptVariables = { targetOrigin: string };
export type MicroappScriptBuilder = (
  options: MicroappScriptVariables
) => string;

export function getRoutingScriptBuilder(): MicroappScriptBuilder {
  const script = minifyAndObfuscateScript(`
(function() {
	if (!window.__microappRouting) {
		window.__microappRouting = true;

		window.addEventListener('message', (event) => {
		  if (event.origin !== '__TARGET_ORIGIN__') {
		    return;
      }

      if (event.data.type === '${MICROAPP_POP_STATE_EVENT_NAME}') {
        history.back();
      }
    });

		function notifyRouteChange(trigger) {
			const url = window.location.href;
			window.parent.postMessage(
				{
					type: '${MICROAPP_ROUTE_CHANGE_EVENT_NAME}',
					payload: { trigger, url }
				},
				'__TARGET_ORIGIN__'
			);
		}

		window.addEventListener('popstate', () => {
			notifyRouteChange('popstate');
		});

		const originalPushState = history.pushState;
		history.pushState = function(...args) {
			originalPushState.apply(this, args);
			notifyRouteChange('pushState');
		};

		const originalReplaceState = history.replaceState;
		history.replaceState = function(...args) {
			originalReplaceState.apply(this, args);
			notifyRouteChange('replaceState');
		};
		
		notifyRouteChange('load');
	}
}());`);

  return (variables) => replaceScriptVariables(script, variables);
}

export function getResizingScriptBuilder(): MicroappScriptBuilder {
  const script = minifyAndObfuscateScript(`
(function() {
	if (!window.__microappResizing) {
		window.__microappResizing = true;

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
	}
}());`);

  return (variables) => replaceScriptVariables(script, variables);
}

function minifyAndObfuscateScript(script: string): string {
  // Remove multi-line comments
  let minified = script.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove single-line comments
  minified = minified.replace(/\/\/.*$/gm, '');

  // Remove whitespace at the beginning and end of each line
  minified = minified.replace(/^\s+|\s+$/gm, '');

  // Remove newline characters
  minified = minified.replace(/\n+/g, '');

  // Replace multiple spaces with a single space
  minified = minified.replace(/\s+/g, ' ');

  // Optionally remove spaces around certain punctuation characters
  minified = minified.replace(/\s*([=+\-*/{}();,:<>])\s*/g, '$1');

  return minified.trim();
}

function replaceScriptVariables(
  script: string,
  variables: MicroappScriptVariables
): string {
  return script.replace(/__TARGET_ORIGIN__/g, variables.targetOrigin);
}
