import {browser, by, element} from 'protractor'
import {PageBase} from '../basepage/pagebase'
export class PayrollLandingPage extends PageBase{

    url ='/payroll-full-width'
    searchField= element(by.name('search-term'));
    personalDataLink = element(by.xpath("//a[contains(text(),'Personal data')]"));
    salaryDataLink = element(by.xpath("//a[contains(text(),'Salary data')]"));
    absencePeriodLink = element(by.xpath("//a[contains(text(),'Absence periods')]"));
    closePayrollButton = element(by.buttonText("Close payroll"));

    lastNameColHeader = element(by.xpath("//th[contains(text(),'Last name')]"));   
    firstNameColHeader = element(by.xpath("//th[contains(text(),'First name')]")); 
    emailColHeader = element(by.xpath("//th[contains(text(),'Email')]"));    
    geburtstagColHeader = element(by.xpath("//th[contains(text(),'Geburtstag')]"));
    nationalityColHeader = element(by.xpath("//th[contains(text(),'Nationalität')]"));
    maritalStatusColHeader = element(by.xpath("//th[contains(text(),'Familienstand')]"));
    officeLocationColHeader = element(by.xpath("//th[contains(text(),'Office')]"));

    
}