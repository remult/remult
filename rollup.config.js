export default {
    entry: 'dist/index.js',
    dest: 'dist/bundles/radweb.umd.js',
    sourceMap: false,
    format: 'umd',
    moduleName: 'radweb',
    globals: {
        '@angular/core': 'ng.core',
        '@angular/common': 'ng.common',
        'rxjs': 'Rx',
        'rxjs/Observable': 'Rx',
        'rxjs/ReplaySubject': 'Rx',
        'rxjs/add/operator/map': 'Rx.Observable.prototype',
        'rxjs/add/operator/mergeMap': 'Rx.Observable.prototype',
        'rxjs/add/operator/pluck': 'Rx.Observable.prototype',
        'rxjs/add/operator/first': 'Rx.Observable.prototype',
        'rxjs/add/observable/fromEvent': 'Rx.Observable',
        'rxjs/add/observable/merge': 'Rx.Observable',
        'rxjs/add/observable/throw': 'Rx.Observable',
        'rxjs/add/observable/of': 'Rx.Observable'
    }
  }
