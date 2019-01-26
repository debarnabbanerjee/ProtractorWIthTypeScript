import { browser, element } from "protractor";
import  {landingPage} from "../pages/landingpage/landing-page.po"
import {tablePage} from "../pages/anotherpage/tablePage"

describe("Testing ArrayFUnction", () => {

    let landingpage = new landingPage();
    let tablepage = new tablePage();

    beforeAll(() =>{    
        browser.waitForAngularEnabled(false);
        browser.get("file:///C:/Users/Debar/Desktop/langingPage.html");
        browser.sleep(2000);
    })

    it('Exatrct all values from an departure list', () => {
    
    let promise = landingpage.getAllDEparturesFromDropList();
    promise.then((result) => {
        let promise1 = tablepage.getAllDepartureLocationsFromTable();
        promise1.then((result1) => {
            try{                
                result = result.toString().replace("[","").replace("]","").trim();
                result1 = result1.toString().replace("[","").replace("]","").trim();

                // console.log(result);
                // console.log("*******************************************")                
                // console.log(result1);

                console.log("changing them to array")

                var droplistvalues = result.split(",");
                var pagevalues = result1.split(",");

                droplistvalues.shift();

                droplistvalues.sort()
                console.log(droplistvalues);
                console.log("*******************************************")

                pagevalues.sort() 
                console.log(pagevalues);

                // compare the two arrays and assert it
                
                
            }catch(err){
                console.log(err);
            }            
        });

        

    });

        


    })
});
