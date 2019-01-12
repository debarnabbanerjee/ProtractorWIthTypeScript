import {browser, by, element} from 'protractor'
import {landingPage} from "../pages/landingpage/landing-page.po";

describe('Testing the angular application',() => {
    
    let lp = new landingPage();

    beforeEach(function(){
        browser.get('http://localhost:8808');
        browser.waitForAngularEnabled(true);
        browser.sleep(2000)
    })

    it('Testing the angular application',() =>{
        expect(lp.createCourses.isPresent()).toBeTruthy();

    })
})