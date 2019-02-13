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
var e2e_utils_1 = require("../e2e.utils");
var LoginPage = /** @class */ (function (_super) {
    __extends(LoginPage, _super);
    function LoginPage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.url = '/login/index';
        _this.email = protractor_1.element(protractor_1.by.id('email'));
        _this.password = protractor_1.element(protractor_1.by.id('password'));
        _this.loginBtn = protractor_1.element(protractor_1.by.buttonText('Einloggen'));
        return _this;
    }
    LoginPage.prototype.doLogin = function (username, psswrd) {
        e2e_utils_1.E2EUtil.WriteText(this.email, username);
        e2e_utils_1.E2EUtil.WriteText(this.password, psswrd);
        e2e_utils_1.E2EUtil.click(this.loginBtn);
    };
    return LoginPage;
}(pagebase_1.PageBase));
exports.LoginPage = LoginPage;
