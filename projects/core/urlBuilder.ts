export class UrlBuilder {
  constructor(public url: string) {}
  add(key: string, value: any) {
    if (this.url.indexOf('?') >= 0) this.url += '&'
    else this.url += '?'
    this.url += encodeURIComponent(key) + '=' + encodeURIComponent(value)
  }
  addObject(object: any, suffix = '') {
    if (object != undefined)
      for (var key in object) {
        let val = object[key]
        this.add(key + suffix, val)
      }
  }
}

export function getURL(input?: string | undefined | URL) {
  if (input) {
    if (input instanceof URL) return input
    try {
      return new URL(input)
    } catch (error) {
      // URL is invalid, use fallback base
      try {
        return new URL(input, 'http://fallback-url-remult-base')
      } catch (error) {
        // URL is invalid, use fallback
      }
    }
  }
  return new URL('http://fallback-url-remult')
}
