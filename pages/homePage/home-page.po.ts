import {browser, by, element} from 'protractor'
import {PageBase} from '../basepage/pagebase'
export class HomePage extends PageBase{

    yourWorkForceLabel = element(by.xpath("//*[contains(text(),'Your workforce at a glance')]"));
    employeesSideMenu = element(by.xpath("//a[@href='/staff']"));
    recreutingSideMenu = element(by.xpath("//a[@href='/recruiting']"));
    payrollSideMenu = element(by.xpath("//a[@href='/payroll-full-width']"));
}