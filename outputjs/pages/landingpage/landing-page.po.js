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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var protractor_1 = require("protractor");
var pagebase_1 = require("../basepage/pagebase");
var landingPage = /** @class */ (function (_super) {
    __extends(landingPage, _super);
    function landingPage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    landingPage.prototype.loginToApplication = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        protractor_1.browser.sleep(2000);
                        protractor_1.element(protractor_1.by.xpath("//input[@name='userName']")).sendKeys("debarnab");
                        protractor_1.element(protractor_1.by.xpath("//input[@name='password']")).sendKeys("debarnab");
                        protractor_1.element(protractor_1.by.xpath("//input[@name='login']")).click();
                        protractor_1.browser.sleep(2000);
                        return [4 /*yield*/, protractor_1.element.all(protractor_1.by.xpath("//select[@name='fromPort']/*")).getText().then(function (items) {
                                // console.log(items);
                                return items;
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // /html/body/div/table/tbody/tr/td[2]/table/tbody/tr[4]/td/table/tbody/tr/td[2]/table/tbody/tr[5]/td/form/table/tbody/tr[4]/td[2]/select
    //  alldepatrurelocations = element(by.xpath("//select[@name='fromPort']/*")); 
    landingPage.prototype.getAllUsageCategoriesDropListElements = function () {
        //     // I need to extract all the droplist values from //select[@name='fromPort'] and then put them into an array and equate that array
        //     // with another one in jasmine test case present in test.ts file. 
        protractor_1.element.all(protractor_1.by.xpath("//select[@name='fromPort']/*")).getText().then(function (items) {
            console.log(items);
            return items;
        });
        // console.log(departure);
    };
    return landingPage;
}(pagebase_1.PageBase));
exports.landingPage = landingPage;
