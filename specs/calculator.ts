import {browser, by, element} from 'protractor'

describe('Calculator Test', () => {

   beforeEach(function(){
    browser.get('https://juliemr.github.io/protractor-demo/');
   });


   it('Launch Url Check',() => {
       expect(browser.getTitle()).toContain('Super');       
   })

   it('Add 2 numbers', () => {
        element(by.model('first')).sendKeys(12);
        element(by.model('second')).sendKeys(13);
        element(by.id('gobutton')).click();
   })
})
