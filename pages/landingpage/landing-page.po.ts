import {browser, by, element} from "protractor"
import {landingPageData} from "../../test-data/landingPageData";
import {PageBase} from "../basepage/pagebase";

export class landingPage extends  PageBase {
    allCourses = element(by.linkText('All Courses')); 
    createCourses = element(by.linkText('Create courses'));    
    search = element(by.buttonText('Search'));    

}