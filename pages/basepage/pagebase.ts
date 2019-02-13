import {browser, by, element} from "protractor"

export class PageBase {
    
   url = ""; 
   
   navigateTo(){
        browser.get(this.url);
   }

}
 