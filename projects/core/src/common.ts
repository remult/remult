import { ValueOrFunction } from './column-interfaces';
import { isFunction } from 'util';

export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}


export function functionOrString(f: string | (() => string)): string {
  if (isFunction(f)) {
    let x = f as any;
    return x();
  }
  return f.toString();
}

export function getValueOrFunction<T>(f: ValueOrFunction<T>): T {
  if (isFunction(f)) {
    let x = f as any;
    return x();
  }
  return <T>f;
}