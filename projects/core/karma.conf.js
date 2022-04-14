// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
const ci = process.env.CI;

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../../coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: !ci,
    browsers: ci ? ['ChromeHeadless'] : ["Chrome"],
    singleRun: ci,
    preprocessor: {
      '**/**/*.ts': ['coverage']
    },
    coverageReporter: {
      reporters: [{type: 'lcov'}]
    },
  });
};
