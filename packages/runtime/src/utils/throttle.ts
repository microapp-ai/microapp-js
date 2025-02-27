export function throttle<TFunction extends Function>(
  callback: TFunction,
  delay: number
): TFunction {
  let last: number;
  let timer: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: any[]) {
    const context = this;
    const now = +new Date();

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
  } as any;
}
