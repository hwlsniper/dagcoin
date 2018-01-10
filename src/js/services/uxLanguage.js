(function () {
  'use strict';

  angular.module('copayApp.services')
  .factory('uxLanguage', ($log, lodash, gettextCatalog, amMoment, configService) => {
    const root = {};
    const ENGLISH = 'en';

    root.availableLanguages = [{
      name: 'English',
      isoCode: 'en',
    }, {
      name: '中文',
      isoCode: 'zh_CN',
      useIdeograms: true,
    }, {
      name: 'Pусский',
      isoCode: 'ru_RU',
    }, {
      name: 'Bahasa Indonesia',
      isoCode: 'id_ID',
    }, {
      name: 'Eesti keel',
      isoCode: 'et_EE',
    }];

    root.currentLanguage = null;

    root.set = function (lang) {
      $log.debug(`Setting default language: ${lang}`);
      gettextCatalog.setCurrentLanguage(ENGLISH);
      // if (lang !== ENGLISH) { gettextCatalog.loadRemote(`languages/${lang}.json`); }
      amMoment.changeLocale(ENGLISH);
      root.currentLanguage = lang;
    };

    root.getCurrentLanguage = function () {
      return root.currentLanguage;
    };

    root.getCurrentLanguageName = function () {
      return root.getName(root.currentLanguage);
    };

    root.getCurrentLanguageInfo = function () {
      return lodash.find(root.availableLanguages, {
        isoCode: root.currentLanguage
      });
    };

    root.getLanguages = function () {
      return root.availableLanguages;
    };

    root.init = function () {
      root.set(ENGLISH);
    };

    root.update = function () {
      let userLang = configService.getSync().wallet.settings.defaultLanguage;

      if (!userLang) {
        userLang = ENGLISH;
      }

      if (userLang !== gettextCatalog.getCurrentLanguage()) {
        root.set(userLang);
      }
      return userLang;
    };

    root.getName = function (lang) {
      return lodash.result(lodash.find(root.availableLanguages, {
        isoCode: lang
      }), 'name');
    };

    return root;
  });
}());
