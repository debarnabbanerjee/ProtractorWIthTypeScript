import {browser, by, element, ElementFinder} from "protractor";
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";


export class landingPage extends  PageBase {

    
     loginToApplication(){
        browser.sleep(2000);
        element(by.xpath("//input[@name='userName']")).sendKeys("debarnab"); 
        element(by.xpath("//input[@name='password']")).sendKeys("debarnab"); 
        element(by.xpath("//input[@name='login']")).click(); 
        browser.sleep(2000);
    }

    departure = element(by.xpath("//select[@name='fromPort']"));
   //  alldepatrurelocations = element(by.xpath("//select[@name='fromPort']/*")); 

    getAllUsageCategoriesDropListElements() {

        // I need to extract all the droplist values from //select[@name='fromPort'] and then put them into an array and equate that array
        // with another one in jasmine test case present in test.ts file. 

        

      
    }   

}