﻿/**
 * MKNoteWebclipper namespace.
 */
if(typeof MKNoteWebclipper == 'undefined'){
    var MKNoteWebclipper = {};
};
MKNoteWebclipper = {
    loginCookieName: '.iNoteAuth',
    baseUrl: 'http://notelocal.sdo.com',
    iNoteAuthCookieHost: '.notelocal.sdo.com',
    menuActionSwitcher: function(event, clipType){
        var self = this;
        self.Util.log(gContextMenu);
        switch(clipType){
            case 'selection':
                self.clipSelection();
                break;
            case 'curimage':
                self.clipImage();
                break;
            case 'curlink':
                self.clipLink();
                break;
            case 'content':
                self.clipPageContent();
                break;
            case 'links':
                self.clipAllLinks();
                break;
            case 'images':
                self.clipAllImages();
                break;
            case 'url':
                self.clipPageUrl();
                break;
            case 'curlink':
                self.clipLink();
                break;
            case 'newnote':
                self.newNote();
                break;
            case 'serializeimage':
                self.serializeImage();
                break;
            default:
                break;
        }
    },
    clipSelection: function(){
        var self = this,
        userSelectionText = content.getSelection().toString();
        self.Util.log(userSelectionText);
        if(userSelectionText.trim() == '') return;
        self.Cookie.get(self.baseUrl, '.iNoteAuth', self.iNoteAuthCookieHost);
    },
    clipPageContent: function(){
        var self = this;
        MKNoteWebclipper.Notification.show();
        return;
        self.Note.saveNote('hello world', content.location.href, '你好');
    },
    checkLogin: function(callback){
        var self = this,
        cookie = self.Cookie.get(self.baseUrl, self.loginCookieName, self.iNoteAuthCookieHost);
        if(cookie == null){
            var popLoginWin = content.openDialog(self.baseUrl + '/login', '','chrome, titlebar = no, left = 10, top = 10, width = 800, height = 600, resizable = no');
            self.Cookie.getObserverService(self.loginCookieName, function(){
                popLoginWin.close();
                callback && callback();
            });
        }else{
            callback && callback();
        }
    },
    i18n: function(msg){
        return '';
    },
    setStringBundle: function(stringBundle){
        this._stringBundle = stringBundle;
    },
    restartFirefox: function(){
        Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup)
        .quit(Components.interfaces.nsIAppStartup.eAttemptQuit | Components.interfaces.nsIAppStartup.eRestart);
    }
}