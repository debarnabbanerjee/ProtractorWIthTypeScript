"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var login_page_po_1 = require("../pages/login/login-page.po");
var home_page_po_1 = require("../pages/homePage/home-page.po");
var payroll_landing_page_po_1 = require("../pages/payroll/payroll-landing-page.po");
var e2e_utils_1 = require("../pages/e2e.utils");
var using = require('jasmine-data-provider');
describe('Verify Payroll Tab', function () {
    var loginPage = new login_page_po_1.LoginPage();
    var homePage = new home_page_po_1.HomePage();
    var payrollPage = new payroll_landing_page_po_1.PayrollLandingPage();
    beforeAll(function () {
        protractor_1.browser.waitForAngularEnabled(false);
        loginPage.navigateTo();
        loginPage.doLogin('svetlanatoday@gmail.com', 'Munich0!');
        protractor_1.browser.sleep(2000);
        expect(homePage.employeesSideMenu.isDisplayed).toBeTruthy;
        expect(homePage.payrollSideMenu.isDisplayed).toBeTruthy;
        expect(homePage.recreutingSideMenu.isDisplayed).toBeTruthy;
    });
    it('Validate Proper Display of Payroll Page UI Elements', function () {
        e2e_utils_1.E2EUtil.click(homePage.payrollSideMenu);
        protractor_1.browser.sleep(2000);
        expect(payrollPage.searchField.isElementPresent).toBeTruthy();
        expect(payrollPage.personalDataLink.isElementPresent).toBeTruthy();
        expect(payrollPage.salaryDataLink.isElementPresent).toBeTruthy();
        expect(payrollPage.absencePeriodLink.isElementPresent).toBeTruthy();
        expect(payrollPage.lastNameColHeader.isElementPresent).toBeTruthy();
        expect(payrollPage.firstNameColHeader.isElementPresent).toBeTruthy();
        expect(payrollPage.emailColHeader.isElementPresent).toBeTruthy();
        expect(payrollPage.geburtstagColHeader.isElementPresent).toBeTruthy();
        expect(payrollPage.nationalityColHeader.isElementPresent).toBeTruthy();
        expect(payrollPage.maritalStatusColHeader.isElementPresent).toBeTruthy();
        expect(payrollPage.officeLocationColHeader.isElementPresent).toBeTruthy();
        //E2EUtil.validatNumberOfElementsPresent(payrollPage.searchField,1);
        //expect(element(by.binding('person.name')).isPresent()).toBe(true);
    });
});
