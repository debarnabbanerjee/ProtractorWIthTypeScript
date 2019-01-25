"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var landing_page_po_1 = require("../pages/landingpage/landing-page.po");
describe("Testing ArrayFUnction", function () {
    it('Exatrct all values from an array', function () {
        var landingpage = new landing_page_po_1.landingPage();
        console.log("Testing Again.....");
        protractor_1.browser.get("http://newtours.demoaut.com/mercurysignon.php");
        protractor_1.browser.sleep(2000);
        landingpage.loginToApplication();
        landingpage.departure.click();
        protractor_1.browser.sleep(2000);
        var alldeparture = [];
        console.log("No of departures size " + alldeparture.length);
    });
});
