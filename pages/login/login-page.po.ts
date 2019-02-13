import {browser, by, element} from 'protractor'
import {PageBase} from '../basepage/pagebase'
import {E2EUtil} from '../e2e.utils'
export class LoginPage extends PageBase{

    url ='/login/index'
    email= element(by.id('email'));
    password = element(by.id('password'));
    loginBtn = element(by.buttonText('Einloggen'));

    doLogin(username: string, psswrd: string){
        E2EUtil.WriteText(this.email,username);
        E2EUtil.WriteText(this.password,psswrd);
        E2EUtil.click(this.loginBtn);
    }
}