import { browser, by, element } from 'protractor';
import { Observable } from "rxjs/Observable";
import { promise as wdpromise, WebDriver, WebElement, WebElementPromise } from 'selenium-webdriver';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('app-root h1')).getText();
  }
}
