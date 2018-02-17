(function () {
  'use strict';

  angular.module('dagcoin.services')
  .factory('localStorageService', () => {
    const root = {};
    const ls = ((typeof window.localStorage !== 'undefined') ? window.localStorage : null);

    if (!ls) {
      throw new Error('localstorage not available');
    }

    root.get = function (k, cb) {
      return cb(null, ls.getItem(k));
    };

    root.getSync = function (k) {
      return ls.getItem(k);
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function (name, value, cb) {
      root.get(name,
        (err, data) => {
          if (data) {
            return cb('EXISTS');
          }
          return root.set(name, value, cb);
        });
    };

    root.set = function (k, v, cb) {
      ls.setItem(k, v);
      return cb();
    };

    root.setSync = function (k, v) {
      ls.setItem(k, v);
    };

    root.removeSync = function (k) {
      ls.removeItem(k);
    };

    root.remove = function (k, cb) {
      ls.removeItem(k);
      return cb();
    };

    return root;
  });
}());
