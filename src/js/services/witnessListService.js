(function () {
  'use strict';

  angular.module('dagcoin.services').factory('witnessListService', () => {
    const root = {};
    console.log('witnessListService');
    root.currentWitness = null;
    return root;
  });
}());
