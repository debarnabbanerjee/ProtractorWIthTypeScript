"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var landing_page_po_1 = require("../pages/landingpage/landing-page.po");
var tablePage_1 = require("../pages/anotherpage/tablePage");
describe("Testing ArrayFUnction", function () {
    var landingpage = new landing_page_po_1.landingPage();
    var tablepage = new tablePage_1.tablePage();
    beforeAll(function () {
        protractor_1.browser.waitForAngularEnabled(false);
        protractor_1.browser.get("file:///C:/Users/Debar/Desktop/langingPage.html");
        protractor_1.browser.sleep(2000);
    });
    it('Exatrct all values from an departure list', function () {
        var promise = landingpage.getAllDEparturesFromDropList();
        promise.then(function (result) {
            var promise1 = tablepage.getAllDepartureLocationsFromTable();
            promise1.then(function (result1) {
                try {
                    result = result.toString().replace("[", "").replace("]", "").trim();
                    result1 = result1.toString().replace("[", "").replace("]", "").trim();
                    // console.log(result);
                    // console.log("*******************************************")                
                    // console.log(result1);
                    console.log("changing them to array");
                    var droplistvalues = result.split(",");
                    var pagevalues = result1.split(",");
                    droplistvalues.shift();
                    droplistvalues.sort();
                    console.log(droplistvalues);
                    console.log("*******************************************");
                    pagevalues.sort();
                    console.log(pagevalues);
                }
                catch (err) {
                    console.log(err);
                }
            });
        });
    });
});
