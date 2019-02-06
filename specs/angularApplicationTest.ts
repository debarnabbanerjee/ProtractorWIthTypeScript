import {browser, by, element} from 'protractor'
import {landingPage} from "../pages/landingpage/landing-page.po";

describe('Testing the angular application',() => {
    
    let lp = new landingPage();

    beforeEach(function(){
        
        browser.get('http://localhost:8808');        
        browser.sleep(2000)
        browser.waitForAngular();
    })

    it('Validate Page Title',() =>{
       // expect(browser.getTitle()).toEqual("ExecuteAutomation Courses");
    })

    it('Testing the angular application UI Elements',() =>{
        console.log("Testing 1"); 
    })

    it('Testing the angular application UI Elements',() =>{
        console.log("Testing 2"); 
    })

    it('Testing the angular application UI Elements',() =>{
        console.log("Testing 3"); 
    })

    it('Testing the angular application UI Elements',() =>{
        console.log("Testing 4"); 
    })
})