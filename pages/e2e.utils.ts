import { by, element, protractor, ElementFinder, browser } from 'protractor'

export class E2EUtil {
    static waitForElementToAppearOnScreen(element: ElementFinder) {
        var EC = protractor.ExpectedConditions;
        browser.wait(EC.visibilityOf(element), 5000, "Element not present in DOM.");
    }

    static click(element: ElementFinder) {
        this.waitForElementToAppearOnScreen(element);
        element.click();
    }

    static WriteText(element: ElementFinder, text: string) {
        this.waitForElementToAppearOnScreen(element);
        element.sendKeys(text);
    }

    static validatNumberOfElementsPresent(element: ElementFinder, numberOfElementsPresent: number) {
        
        browser.driver.findElements(element).then(function(elems){
                expect(elems.length).toEqual(numberOfElementsPresent);
        
        });
    }
}