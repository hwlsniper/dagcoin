(function () {
  'use strict';

  angular.module('copayApp.services').factory('transactionsService', (lodash, ENV, utilityService, profileService,
                                                                      addressbookService, animationService, correspondentListService,
                                                                      gettextCatalog, $rootScope, $modal) => {
    const root = {};
    const breadcrumbs = require('byteballcore/breadcrumbs.js');

    /**
     * This will be moved into tx directive
     * not used now
     * @param btx transaction
     * @param walletSettings can be get from configService.getSync().wallet.settings
     * @param indexScope $scope.indexScope
     */
    root.openTxModal = function (params) {
      const btx = params.btx;
      const walletSettings = params.walletSettings;
      const isPrivate = params.isPrivate;
      const unitName = params.unitName;

      console.log(btx);
      $rootScope.modalOpened = true;
      const fc = profileService.focusedClient;
      const ModalInstanceCtrl = function ($scope, $modalInstance) {
        $scope.btx = btx;
        $scope.isPrivate = isPrivate;
        $scope.settings = walletSettings;
        $scope.color = fc.backgroundColor;

        // TODO sinan not used, delete after test
        $scope.getAmount = function (amount) {
          alert(amount);
          return '???';
          // return self.getAmount(amount);
        };

        $scope.getUnitName = function () {
          return unitName;
        };

        $scope.transactionAddress = function (address) {
          return root.getTransactionAddress(address);
        };

        $scope.openInExplorer = function () {
          const url = `https://${ENV.explorerPrefix}explorer.dagcoin.org/#${btx.unit}`;
          if (typeof nw !== 'undefined') {
            nw.Shell.openExternal(url);
          } else if (utilityService.isCordova) {
            cordova.InAppBrowser.open(url, '_system');
          }
        };

        $scope.copyAddress = function (address) {
          utilityService.copyAddress($scope, address);
        };

        $scope.showCorrespondentList = function () {
          root.showCorrespondentListToReSendPrivPayloads(btx, walletSettings);
        };

        $scope.cancel = function () {
          breadcrumbs.add('dismiss tx details');
          try {
            $modalInstance.dismiss('cancel');
          } catch (e) {
            // continue regardless of error
          }
        };
      };

      const modalInstance = $modal.open({
        templateUrl: 'views/modals/tx-details.html',
        windowClass: 'modal-transaction-detail',
        controller: ModalInstanceCtrl
      });

      const disableCloseModal = $rootScope.$on('closeModal', () => {
        breadcrumbs.add('on closeModal tx details');
        modalInstance.dismiss('cancel');
      });

      modalInstance.result.finally(() => {
        $rootScope.modalOpened = false;
        disableCloseModal();
        const m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });
    };

    root.showCorrespondentListToReSendPrivPayloads = function (btx, walletSettings) {
      $rootScope.modalOpened = true;
      const self = this;
      const fc = profileService.focusedClient;
      const ModalInstanceCtrl = function ($scope, $modalInstance, $timeout, go, notification) {
        $scope.btx = btx;
        $scope.settings = walletSettings;
        $scope.color = fc.backgroundColor;

        $scope.readList = function () {
          $scope.error = null;
          correspondentListService.list((err, ab) => {
            if (err) {
              $scope.error = err;
              return;
            }
            $scope.list = ab;
            $scope.$digest();
          });
        };

        $scope.sendPrivatePayments = function (correspondent) {
          const indivisibleAsset = require('byteballcore/indivisible_asset');
          const walletGeneral = require('byteballcore/wallet_general');
          indivisibleAsset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, (arrRecipientChains) => {
            walletGeneral.sendPrivatePayments(correspondent.device_address, arrRecipientChains, true, null, () => {
              modalInstance.dismiss('cancel');
              go.history();
              $timeout(() => {
                notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
              });
            });
          });
        };

        $scope.back = function () {
          self.openTxModal(btx);
        };
      };

      const modalInstance = $modal.open({
        templateUrl: 'views/modals/correspondentListToReSendPrivPayloads.html',
        windowClass: animationService.modalAnimated.slideRight,
        controller: ModalInstanceCtrl,
      });

      const disableCloseModal = $rootScope.$on('closeModal', () => {
        modalInstance.dismiss('cancel');
      });

      modalInstance.result.finally(() => {
        $rootScope.modalOpened = false;
        disableCloseModal();
        const m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });
    };

    root.getTransactionAddress = (address) => {
      if (!address) {
        return { fullName: gettextCatalog.getString('Incoming transaction') };
      }
      let fullName = address;
      const contact = addressbookService.getContact(address);
      if (contact) {
        fullName = `${contact.first_name} ${contact.last_name || ''}`;
      }
      return { fullName, address };
    };

    root.getTransactionStatus = (transaction) => {
      if (!transaction.confirmations) {
        return { icon: 'autorenew', title: gettextCatalog.getString('Pending') };
      }

      if (transaction.action === 'received') {
        return { icon: 'call_received', title: gettextCatalog.getString('Received') };
      } else if (transaction.action === 'moved') {
        return { icon: 'code', title: gettextCatalog.getString('Moved') };
      }
      return { icon: 'call_made', title: gettextCatalog.getString('Sent') };
    };


    return root;
  });
}());