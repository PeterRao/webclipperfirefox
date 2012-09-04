﻿//@huntbao @mknote
//All right reserved
;(function($){
    $.extend(MKNoteWebclipper, {
        loginCookieName: '.iNoteAuth',
        baseUrl: 'http://notelocal.sdo.com',
        iNoteAuthCookieHost: '.notelocal.sdo.com',
        mkNoteWebclipperPopups: [],//store all popups, every tab can have a popup
        menuActionSwitcher: function(event, clipType){
            var self = this;
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
                case 'newnote':
                    self.newNote();
                    break;
                case 'serializeimage':
                    self.serializeImage(event.target.getAttribute('checked'));
                    break;
                default:
                    break;
            }
        },
        clipSelection: function(){
            var self = this,
            userSelectionText = content.getSelection().toString();
            if(userSelectionText.trim() == '') return;
            self.Note.saveNote(userSelectionText, content.location.href, userSelectionText);
        },
        clipImage: function(){
            var self = this,
            target = gContextMenu.target;
            self.Note.saveImgs({
                imgs: [target],
                title: content.document.title,
                sourceurl: content.location.href
            });
        },
        clipLink: function(){
            var self = this,
            target = gContextMenu.target,
            title = target.title || target.text || target.href,
            noteContent = '<a href="' + target.href + '" title="' + target.title + '">' + target.text + '</a>';
            self.Note.saveNote(title, content.location.href, noteContent);    
        },
        clipPageContent: function(){
            var self = this,
            title = content.document.title,
            sourceurl = content.location.href,
            noteContent =  self.Popup.getHTMLByNode($(content.document.body))
            self.Note.savePageContent(title, sourceurl, noteContent);
        },
        clipAllLinks: function(){
            var self = this,
            links = content.document.querySelectorAll('a'),
            noteContent = '';
            for(var i = 0, l = links.length, link; i < l; i++){
                link = links[i];
                noteContent += '<a href="' + link.href + '" title="' + link.title + '">' + link.text + '</a><br />';
            }
            self.Note.saveNote(content.document.title, content.location.href, noteContent);
        },
        clipAllImages: function(){
            var self = this,
            imgs = content.document.querySelectorAll('img'),
            filteredImg = {},
            filteredImgTitles = [],
            isToSave = function(url){
                var suffix = url.substr(url.length - 4);
                return /^\.(gif|jpg|png)$/.test(suffix);
            }
            for(var i = 0, img, l = imgs.length, src; i < l; i++){
                img = imgs[i];
                src = img.src;
                if(!isToSave(src)) continue;
                if(filteredImg[src]) continue;
                filteredImg[src] = 1;
                filteredImgTitles.push(img.title || img.alt || '');
            }
            self.Note.saveImgs({
                imgs: imgs,
                title: content.document.title,
                sourceurl: content.location.href
            });
        },
        clipPageUrl: function(){
            var self = this,
            url = content.location.href,
            title = content.document.title,
            favIconUrl = self.getFaviconForPage(url),
            noteContent = '<img src="' + favIconUrl.spec + '" title="' + title + '" alt="' + title + '"/>' +
                '<a href="' + url + '" title="' + title + '">' + url + '</a>';
            self.Note.saveNote(title, url, noteContent);
        },
        newNote: function(){
            var self = this;
            self.createPopup();
        },
        serializeImage: function(checked){
            var self = this;
            self.options.serializeImg = checked;
        },
        createPopup: function(){
            if(content.currentMaikuWebclipperPopup) return;
            var self = this,
            popupInstance = $('<div mkclip="true" style="position:fixed;right:8px;top:8px;width:450px;height:450px;\
            min-height:304px;max-height:524px;z-index:;border-radius:3px;box-shadow:0 0 5px 0 #333;overflow:hidden;z-index:20120830"></div>', content.document)
                .hide()
                .appendTo(content.document.body),
            iframe = $('<iframe frameborder="0" style="width:100%;height:100%;"></iframe>', content.document).appendTo(popupInstance),
            iframeWin = iframe[0].contentWindow;
            iframeWin.location.href = 'chrome://mknotewebclipper/content/popup.xul';
            content.currentMaikuWebclipperPopup = {
                clipper: self,
                instance: popupInstance,
                popupContext: content
            }
            self.mkNoteWebclipperPopups.push(content.currentMaikuWebclipperPopup);
        },
        deletePopup: function(popup){
            var self = this,
            idx = self.mkNoteWebclipperPopups.indexOf(popup);
            if(idx != -1){
                popup.popupContext.currentMaikuWebclipperPopup = null;
                self.mkNoteWebclipperPopups.splice(idx, 1);
            }
        },
        checkLogin: function(callback, showNotification){
            var self = this;
            cookie = self.Observer.getCookie(self.baseUrl, self.loginCookieName, self.iNoteAuthCookieHost);
            if(cookie == null){
                showNotification && self.Notification.show(self.i18n.getMessage('NotLogin'), false);
                var popLoginWin = content.openDialog(self.baseUrl + '/login', '','chrome, titlebar = no, left = 10, top = 10, width = 800, height = 600, resizable = no');
                self.addCookieObserver.addObserver('popupLoginObserver', self.loginCookieName, false, function(action){
                    popLoginWin.close();
                    callback && callback();
                });
            }else{
                callback && callback();
            }
        },
        logOut: function(){
            var self = this;
            $.get(self.baseUrl + '/account/logout');
        },
        getUser: function(callback){
            var self = this;
            if(self.userData){
                callback(self.combineData(self.userData));
                return;
            }
            var cookie = self.Observer.getCookie(self.baseUrl, self.loginCookieName, self.iNoteAuthCookieHost);
            if(cookie){
                //user logined, get user from localStorage or send request to get user
                $.ajax({
                    url: self.baseUrl + '/plugin/clipperdata',
                    success: function(data){
                        if(data.error){
                            //todo
                            callback(self.combineData());
                            return;
                        }
                        self.Util.log(data);
                        self.userData = data;
                        callback(self.combineData(data));
                    },
                    error: function(){
                        callback(self.combineData());
                    }
                });
            }else{
                callback(self.combineData());
            }
        },
        combineData: function(user){
            var self = this;
            return {
                user: user,
                settings: self.getSettings()
            }    
        },
        getSettings: function(){
            var self = this,
            options = self.options;
            self.settings = {
                serializeImg: options.serializeImg,
                defaultCategory: options.defaultCategory,
                autoExtractContent: options.autoExtractContent
            }
            return self.settings;
        },
        cookieChanged: function(action){
            var self = this;
            if(action == 'added'){
                //user logined
                self.getUser(function(data){
                    self.updateAllPopups(data);
                });
            }else if(action == 'deleted'){
                //user logout
                self.userData = null;
                self.updateAllPopups(null); 
            }
        },
        updateAllPopups: function(data){
            var self = this;
            for(let i = 0, l = self.mkNoteWebclipperPopups.length; i < l; i++){
                let popupContext = self.mkNoteWebclipperPopups[i].popupContext;
                popupContext.maikuWebclipperPopupIframe.communicationProxy.updateUserInfo(data);
            }
        },
        getFaviconForPage: function(url){
            var faviconService = Components.classes['@mozilla.org/browser/favicon-service;1']
                .getService(Components.interfaces.nsIFaviconService),
            mlIOService = Components.classes["@mozilla.org/network/io-service;1"] 
                    .getService(Components.interfaces.nsIIOService2),
            mURI = mlIOService.newURI(url, null, null);
            return faviconService.getFaviconForPage(mURI);
        },
        restartFirefox: function(){
            Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup)
            .quit(Components.interfaces.nsIAppStartup.eAttemptQuit | Components.interfaces.nsIAppStartup.eRestart);
        }
    });
})(MKNoteWebclipper.jQuery);

