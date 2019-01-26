import {browser, by, element, ElementFinder, promise} from "protractor";
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";
import { async } from "q";


export class landingPage extends  PageBase {
    
    async getAllDEparturesFromDropList(){       

        return await element.all(by.xpath("//select[@name='fromPort']/*")).getText()
        .then(function(items) {
            // console.log(items);
            return items;
        });
        
    }
}