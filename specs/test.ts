import { browser, element } from "protractor";
import  {landingPage} from "../pages/landingpage/landing-page.po"

describe("Testing ArrayFUnction", () => {

    let landingpage = new landingPage();

    beforeAll(() =>{
        console.log("Testing Again.....");
        browser.waitForAngularEnabled(false);
        browser.get("http://newtours.demoaut.com/mercurysignon.php");
        browser.sleep(2000);
    
        let promise = landingpage.loginToApplication();

        promise.then((result) => {
            console.log(result);
        });

        // landingpage.departure.click();
        // landingPage.getAllUsageCategoriesDropListElements();
        browser.sleep(2000);
    })

    it('Exatrct all values from an array', () => { 
        
        let alldeparture: string[] = [];

        // I would like to put all the departure lists in the array alldeparture 
        // alldeparture = landingpage.getAllUsageCategoriesDropListElements();
        // then I would like to print all the values from the array. The thing is 
        // that the array should be available at the test case level

       // console.log("No of departures size " + alldeparture.length); // this should print size as more that one. 

    })
});
