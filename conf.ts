import {Config, browser} from "protractor"
var HtmlReporter = require('protractor-beautiful-reporter');

export let config: Config = {
    framework: "jasmine",

    // capabilities :{
    //     browserName: 'chrome'
    // },

    capabilities: { browserName: 'chrome', chromeOptions: { args: [ "--headless", "--disable-gpu", "--window-size=800,600"] } },

    specs: ['./specs/*.js'],

    seleniumAddress: 'http://localhost:4444/wd/hub',

    onPrepare: function() {
        // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
        jasmine.getEnv().addReporter(new HtmlReporter({
           baseDirectory: 'tmp/screenshots'
        }).getJasmine2Reporter());
     }
}