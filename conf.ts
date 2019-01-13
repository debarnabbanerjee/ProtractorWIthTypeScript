import {Config, browser} from "protractor"

export let config: Config = {
    framework: "jasmine",

    // capabilities :{
    //     browserName: 'chrome'
    // },

    capabilities: { browserName: 'chrome', chromeOptions: { args: [ "--headless", "--disable-gpu", "--window-size=800,600"] } },

    specs: ['./specs/*.js'],

    seleniumAddress: 'http://localhost:4444/wd/hub'
}