import {browser, by, element, ElementFinder, promise} from "protractor";
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";
import { async } from "q";


export class landingPage extends  PageBase {

    
    async loginToApplication(){
        browser.sleep(2000);
        element(by.xpath("//input[@name='userName']")).sendKeys("debarnab"); 
        element(by.xpath("//input[@name='password']")).sendKeys("debarnab"); 
        element(by.xpath("//input[@name='login']")).click(); 
        browser.sleep(2000);

        return await element.all(by.xpath("//select[@name='fromPort']/*")).getText().then(function(items) {
            // console.log(items);
            return items;
        });
    }

    
    // /html/body/div/table/tbody/tr/td[2]/table/tbody/tr[4]/td/table/tbody/tr/td[2]/table/tbody/tr[5]/td/form/table/tbody/tr[4]/td[2]/select
   //  alldepatrurelocations = element(by.xpath("//select[@name='fromPort']/*")); 
    

    getAllUsageCategoriesDropListElements() {

    //     // I need to extract all the droplist values from //select[@name='fromPort'] and then put them into an array and equate that array
    //     // with another one in jasmine test case present in test.ts file. 
        element.all(by.xpath("//select[@name='fromPort']/*")).getText().then(function(items) {
            console.log(items);
            return items;
        });
        // console.log(departure);
    } 
    
    





}