(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('EditContactModalController', EditContactModalController);

  EditContactModalController.$inject = ['$scope', '$stateParams', 'AddressBook', '$state'];

  function EditContactModalController($scope, $stateParams, AddressBook, $state) {
    const address = $stateParams.address;

    $scope.contact = { address };

    $scope.removeContact = () => {
      AddressBook.remove($stateParams.address, () => {
        $state.go('contacts');
      });
    };
  }
})();
