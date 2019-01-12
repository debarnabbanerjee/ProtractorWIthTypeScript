"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var landing_page_po_1 = require("../pages/landingpage/landing-page.po");
describe('Testing the angular application', function () {
    var lp = new landing_page_po_1.landingPage();
    beforeEach(function () {
        protractor_1.browser.get('http://localhost:8808');
        protractor_1.browser.waitForAngularEnabled(true);
        protractor_1.browser.sleep(2000);
    });
    it('Testing the angular application', function () {
        expect(lp.createCourses.isPresent()).toBeTruthy();
    });
});
