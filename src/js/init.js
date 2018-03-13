(function () {
  'use strict';

  angular.element(document).ready(() => {
    // Run copayApp after device is ready.
    const startAngular = function () {
      angular.bootstrap(document, ['copayApp']);
    };

    /*
     var handleBitcoinURI = function(url) {
     if (!url) return;
     if (url.indexOf('glidera') != -1) {
     url = '#/uri-glidera' + url.replace('bitcoin://glidera', '');
     }
     else {
     url = '#/uri-payment/' + url;
     }
     setTimeout(function() {
     window.location = url;
     }, 1000);
     };
     */

    /* Cordova specific Init */
    if (window.cordova !== undefined) {
      document.addEventListener('deviceready', () => {
        /*
         // Back button event
         document.addEventListener('backbutton', function() {
         var loc = window.location;
         var isHome = loc.toString().match(/index\.html#\/$/) ? 'true' : '';
         if (!window.ignoreMobilePause) {
         window.location = '#/cordova/backbutton/'+isHome;
         }
         setTimeout(function() {
         window.ignoreMobilePause = false;
         }, 100);
         }, false);
         */

        document.addEventListener('menubutton', () => {
          window.location = '#/preferences';
        }, false);

        setTimeout(() => {
          navigator.splashscreen.hide();
        }, 2000);

        /*
         window.plugins.webintent.getUri(handleBitcoinURI);
         window.plugins.webintent.onNewIntent(handleBitcoinURI);
         window.handleOpenURL = handleBitcoinURI;
         */

        startAngular();
      }, false);
    } else {
      /*
       try {
       window.handleOpenURL = handleBitcoinURI;
       window.plugins.webintent.getUri(handleBitcoinURI);
       window.plugins.webintent.onNewIntent(handleBitcoinURI);
       } catch (e) {}
       */
      startAngular();
    }
  });
}());
