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
        _this.allCourses = protractor_1.element(protractor_1.by.linkText('All Courses'));
        _this.createCourses = protractor_1.element(protractor_1.by.linkText('Create courses'));
        _this.search = protractor_1.element(protractor_1.by.buttonText('Search'));
        return _this;
    }
    return landingPage;
}(pagebase_1.PageBase));
exports.landingPage = landingPage;
