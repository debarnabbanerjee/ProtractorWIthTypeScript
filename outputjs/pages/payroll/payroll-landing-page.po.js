"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var pagebase_1 = require("../basepage/pagebase");
var PayrollLandingPage = /** @class */ (function (_super) {
    __extends(PayrollLandingPage, _super);
    function PayrollLandingPage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.url = '/payroll-full-width';
        _this.searchField = protractor_1.element(protractor_1.by.name('search-term'));
        _this.personalDataLink = protractor_1.element(protractor_1.by.xpath("//a[contains(text(),'Personal data')]"));
        _this.salaryDataLink = protractor_1.element(protractor_1.by.xpath("//a[contains(text(),'Salary data')]"));
        _this.absencePeriodLink = protractor_1.element(protractor_1.by.xpath("//a[contains(text(),'Absence periods')]"));
        _this.closePayrollButton = protractor_1.element(protractor_1.by.buttonText("Close payroll"));
        _this.lastNameColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'Last name')]"));
        _this.firstNameColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'First name')]"));
        _this.emailColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'Email')]"));
        _this.geburtstagColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'Geburtstag')]"));
        _this.nationalityColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'Nationalität')]"));
        _this.maritalStatusColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'Familienstand')]"));
        _this.officeLocationColHeader = protractor_1.element(protractor_1.by.xpath("//th[contains(text(),'Office')]"));
        return _this;
    }
    return PayrollLandingPage;
}(pagebase_1.PageBase));
exports.PayrollLandingPage = PayrollLandingPage;
