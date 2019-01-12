import {browser, by, element} from "protractor"
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";

export class landingPage extends  PageBase {
    createCourses = element(by.linkText('Create courses'))

    
}