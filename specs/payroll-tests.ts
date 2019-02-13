import { browser, by, element } from 'protractor'
import { LoginPage } from '../pages/login/login-page.po'
import { HomePage } from '../pages/homePage/home-page.po'
import {PayrollLandingPage} from '../pages/payroll/payroll-landing-page.po'
import {E2EUtil} from '../pages/e2e.utils'
var using = require('jasmine-data-provider');

describe('Verify Payroll Tab', () => {
    let loginPage = new LoginPage();
    let homePage = new HomePage();
    let payrollPage = new PayrollLandingPage();
    beforeAll(() => {
        browser.waitForAngularEnabled(false);
        loginPage.navigateTo();
        loginPage.doLogin('svetlanatoday@gmail.com','Munich0!');
        browser.sleep(2000);
        expect(homePage.employeesSideMenu.isDisplayed).toBeTruthy;
        expect(homePage.payrollSideMenu.isDisplayed).toBeTruthy;
        expect(homePage.recreutingSideMenu.isDisplayed).toBeTruthy;
    });

    it('Validate Proper Display of Payroll Page UI Elements', () => {
        E2EUtil.click(homePage.payrollSideMenu);        
        browser.sleep(2000);
        expect(payrollPage.searchField.isPresent()).toBeTruthy();
        expect(payrollPage.personalDataLink.isPresent()).toBeTruthy();
        expect(payrollPage.salaryDataLink.isPresent()).toBeTruthy();
        expect(payrollPage.absencePeriodLink.isPresent()).toBeTruthy();
        expect(payrollPage.lastNameColHeader.isPresent()).toBeTruthy();
        expect(payrollPage.firstNameColHeader.isPresent()).toBeTruthy();
        expect(payrollPage.emailColHeader.isPresent()).toBeTruthy();
        expect(payrollPage.geburtstagColHeader.isPresent()).toBeTruthy();
        expect(payrollPage.nationalityColHeader.isPresent()).toBeTruthy();
        expect(payrollPage.maritalStatusColHeader.isPresent()).toBeTruthy();
        expect(payrollPage.officeLocationColHeader.isPresent()).toBeTruthy();
    });

    

    
});
