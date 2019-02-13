"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HtmlReporter = require('protractor-beautiful-reporter');
exports.config = {
    framework: "jasmine",
    capabilities: { browserName: 'chrome',
        // chromeOptions: { args: ['--start-maximized'] } },
        chromeOptions: { args: ['--start-maximized'] } },
    specs: ['./specs/*.js'],
    seleniumAddress: 'http://localhost:4444/wd/hub',
    baseUrl: 'https://candidate-at-personio-debarnab-banerjee.personio.de',
    onPrepare: function () {
        jasmine.getEnv().addReporter(new HtmlReporter({
            baseDirectory: 'tmp/screenshots'
        }).getJasmine2Reporter());
    }
};
