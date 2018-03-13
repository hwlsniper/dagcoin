(function () {
  'use strict';

  angular.module('copayApp.controllers').controller('correspondentDevicesController',
    ($scope, $timeout, configService, profileService, go, correspondentListService, $state, $rootScope, lodash, ENV) => {
      const wallet = require('byteballcore/wallet.js');
      $scope.editCorrespondentList = false;
      $scope.selectedCorrespondentList = {};
      const fc = profileService.focusedClient;
      $scope.backgroundColor = fc.backgroundColor;

      $scope.state = $state;

      $scope.hideRemove = true;

      // emit added because clicking "pairing device" in sidebar does not set tab as chat directly
      $rootScope.$emit('Local/SetTab', 'chat', true);

      $scope.showCorrespondent = function (correspondent) {
        console.log('showCorrespondent', correspondent);
        correspondentListService.currentCorrespondent = correspondent;
        // listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
        go.path('correspondentDevice');
      };

      $scope.toggleEditCorrespondentList = function () {
        $scope.editCorrespondentList = !$scope.editCorrespondentList;
        $scope.selectedCorrespondentList = {};
      };

      $scope.toggleSelectCorrespondentList = function (addr) {
        $scope.selectedCorrespondentList[addr] = !$scope.selectedCorrespondentList[addr];
      };

      $scope.readList = function () {
        $scope.error = null;

        correspondentListService.getCorrespondentsOrderedByMessageDate().then((correspondents) => {
          correspondentListService.getPendingSharedAddresses().then(() => {
            wallet.readDeviceAddressesUsedInSigningPaths((arrNotRemovableDeviceAddresses) => {
              // adding manually discovery service, because it doesn't exists in signing paths
              arrNotRemovableDeviceAddresses.push(ENV.discoveryDeviceAddress);
              // add a new property indicating whether the device can be removed or not
              for (let i = 0, { length } = correspondents; i < length; i += 1) {
                const corrDev = correspondents[i];
                const ixNotRemovable = arrNotRemovableDeviceAddresses.indexOf(corrDev.device_address);
                // device is removable when not in list
                corrDev.removable = (ixNotRemovable === -1);
                corrDev.clickable = (corrDev.device_address !== ENV.discoveryDeviceAddress && corrDev.name.toLowerCase().indexOf('funding-node') === -1);
              }

              $scope.list = correspondents;
              $scope.$digest();
            });
          });
        }, (err) => {
          if (err) {
            $scope.error = err;
          }
        });
      };

      $scope.hideRemoveButton = function (removable) {
        return $scope.hideRemove || !removable;
      };

      $scope.remove = function (deviceAddress) {
        // check to be safe
        wallet.determineIfDeviceCanBeRemoved(deviceAddress, (bRemovable) => {
          if (!bRemovable) {
            return console.log(`device ${deviceAddress} is not removable`);
          }
          const device = require('byteballcore/device.js');

          // send message to paired device
          // this must be done before removing the device
          device.sendMessageToDevice(deviceAddress, 'removed_paired_device', 'removed');

          // remove device
          device.removeCorrespondentDevice(deviceAddress, () => {
            $scope.hideRemove = true;
            $scope.readList();
            $rootScope.$emit('Local/SetTab', 'chat', true);
          });
        });
      };

      $scope.cancel = function () {
        console.log('cancel clicked');
        go.walletHome();
      };
    });
}());
