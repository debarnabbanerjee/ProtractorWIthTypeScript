import {browser, by, element} from "protractor"
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";

export class landingPage extends  PageBase {
    signInBtn = element(by.id('test'))

    checkElementsPresent(){
        this.signInBtn.click();
    }
}