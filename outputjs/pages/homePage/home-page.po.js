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
var HomePage = /** @class */ (function (_super) {
    __extends(HomePage, _super);
    function HomePage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.yourWorkForceLabel = protractor_1.element(protractor_1.by.xpath("//*[contains(text(),'Your workforce at a glance')]"));
        _this.employeesSideMenu = protractor_1.element(protractor_1.by.xpath("//a[@href='/staff']"));
        _this.recreutingSideMenu = protractor_1.element(protractor_1.by.xpath("//a[@href='/recruiting']"));
        _this.payrollSideMenu = protractor_1.element(protractor_1.by.xpath("//a[@href='/payroll-full-width']"));
        return _this;
    }
    return HomePage;
}(pagebase_1.PageBase));
exports.HomePage = HomePage;
