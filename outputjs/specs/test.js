"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var landing_page_po_1 = require("../pages/landingpage/landing-page.po");
describe("Testing ArrayFUnction", function () {
    it('Exatrct all values from an array', function () {
        var landingpage = new landing_page_po_1.landingPage();
        console.log("Testing Again.....");
        protractor_1.browser.waitForAngularEnabled(false);
        protractor_1.browser.get("http://newtours.demoaut.com/mercurysignon.php");
        protractor_1.browser.sleep(2000);
        landingpage.loginToApplication();
        landingpage.departure.click();
        protractor_1.browser.sleep(2000);
        var alldeparture = [];
        // I would like to put all the departure lists in the array alldeparture 
        // alldeparture = landingpage.getAllUsageCategoriesDropListElements();
        // then I would like to print all the values from the array. The thing is 
        // that the array should be available at the test case level
        console.log("No of departures size " + alldeparture.length); // this should print size as more that one. 
    });
});
