import {browser, by, element, ElementFinder, promise} from "protractor";
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";
import { async } from "q";


export class tablePage extends  PageBase {

    
    
    async getAllDepartureLocationsFromTable(){        


        element(by.xpath("//a[contains(text(),'Table Data')]")).click();
        browser.sleep(2000);

        return await element.all(by.xpath("//table[@id='table']/tbody/tr[*]/td[1]")).getText().then(function(items) {
            // console.log(items);
            return items;
        });
    }
  }