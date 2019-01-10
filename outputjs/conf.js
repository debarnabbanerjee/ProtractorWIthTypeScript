"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    framework: "jasmine",
    capabilities: {
        browserName: 'chrome'
    },
    specs: ['./specs/*.js'],
    seleniumAddress: 'http://localhost:4444/wd/hub'
};
