/**
 * @description writing a custom cause original Object.keys sucks with Typescript
 * @link https://twitter.com/mattpocockuk/status/1681267079977000961
 */
export function objectKeys<TObject extends object>(
  obj: TObject,
): Array<keyof TObject> {
  return Object.keys(obj) as Array<keyof TObject>;
}
