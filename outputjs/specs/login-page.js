"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var login_page_po_1 = require("../pages/login/login-page.po");
var home_page_po_1 = require("../pages/homePage/home-page.po");
var using = require('jasmine-data-provider');
describe('Verify Login Test Case', function () {
    var loginPage = new login_page_po_1.LoginPage();
    var homePage = new home_page_po_1.HomePage();
    beforeAll(function () {
        protractor_1.browser.waitForAngularEnabled(false);
        loginPage.navigateTo();
    });
    it('Validate Login', function () {
        loginPage.doLogin('svetlanatoday@gmail.com', 'Munich0!');
        protractor_1.browser.sleep(5000);
        expect(homePage.employeesSideMenu.isDisplayed).toBeTruthy;
        expect(homePage.payrollSideMenu.isDisplayed).toBeTruthy;
        expect(homePage.recreutingSideMenu.isDisplayed).toBeTruthy;
    });
});
