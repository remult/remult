import { ValueOrExpression } from './column-interfaces';
import { isFunction } from 'util';


export function getValueOrFunction<T>(f: ValueOrExpression<T>): T {
  if (isFunction(f)) {
    let x = f as any;
    return x();
  }
  return <T>f;
}