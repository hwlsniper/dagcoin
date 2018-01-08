(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('EditContactModalController', EditContactModalController);

  EditContactModalController.$inject = ['$scope', '$stateParams', 'addressbookService', '$state'];

  function EditContactModalController($scope, $stateParams, addressbookService, $state) {
    const address = $stateParams.address;

    $scope.contact = { address };

    $scope.removeContact = () => {
      addressbookService.remove($stateParams.address, () => {
        $state.go('contacts');
      });
    };
  }
})();
