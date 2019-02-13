"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var PageBase = /** @class */ (function () {
    function PageBase() {
        this.url = "";
    }
    PageBase.prototype.navigateTo = function () {
        protractor_1.browser.get(this.url);
    };
    return PageBase;
}());
exports.PageBase = PageBase;
