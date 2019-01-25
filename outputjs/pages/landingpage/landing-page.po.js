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
var landingPage = /** @class */ (function (_super) {
    __extends(landingPage, _super);
    function landingPage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.departure = protractor_1.element(protractor_1.by.xpath("//select[@name='fromPort']"));
        return _this;
    }
    landingPage.prototype.loginToApplication = function () {
        protractor_1.browser.sleep(2000);
        protractor_1.element(protractor_1.by.xpath("//input[@name='userName']")).sendKeys("debarnab");
        protractor_1.element(protractor_1.by.xpath("//input[@name='password']")).sendKeys("debarnab");
        protractor_1.element(protractor_1.by.xpath("//input[@name='login']")).click();
        protractor_1.browser.sleep(2000);
    };
    //  alldepatrurelocations = element(by.xpath("//select[@name='fromPort']/*")); 
    landingPage.prototype.getAllUsageCategoriesDropListElements = function () {
        // I need to extract all the droplist values from //select[@name='fromPort'] and then put them into an array and equate that array
        // with another one in jasmine test case present in test.ts file. 
    };
    return landingPage;
}(pagebase_1.PageBase));
exports.landingPage = landingPage;
