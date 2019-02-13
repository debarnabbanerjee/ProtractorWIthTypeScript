"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var E2EUtil = /** @class */ (function () {
    function E2EUtil() {
    }
    E2EUtil.waitForElementToAppearOnScreen = function (element) {
        var EC = protractor_1.protractor.ExpectedConditions;
        protractor_1.browser.wait(EC.visibilityOf(element), 5000, "Element not present in DOM.");
    };
    E2EUtil.click = function (element) {
        this.waitForElementToAppearOnScreen(element);
        element.click();
    };
    E2EUtil.WriteText = function (element, text) {
        this.waitForElementToAppearOnScreen(element);
        element.sendKeys(text);
    };
    E2EUtil.validatNumberOfElementsPresent = function (element, numberOfElementsPresent) {
        protractor_1.browser.driver.findElements(element).then(function (elems) {
            expect(elems.length).toEqual(numberOfElementsPresent);
        });
    };
    return E2EUtil;
}());
exports.E2EUtil = E2EUtil;
