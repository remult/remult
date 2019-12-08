import { Column } from "./column";

export class UrlBuilder {
    constructor(public url: string) {
    }
    add(key: string, value: any) {
      if (this.url.indexOf('?') >= 0)
        this.url += '&';
      else
        this.url += '?';
      this.url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }
    addObject(object: any, suffix = '') {
      if (object != undefined)
        for (var key in object) {
          let val = object[key];
          if (val instanceof Column)
            val = val.value;
          this.add(key + suffix, val);
        }
    }
  }
  