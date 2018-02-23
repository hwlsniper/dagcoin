/* eslint-disable radix,no-nested-ternary,no-shadow,no-plusplus,consistent-return,no-underscore-dangle,no-unused-vars,no-use-before-define,comma-dangle */
(function () {
  'use strict';

  angular.module('copayApp.controllers')
    .controller('walletHomeController',
      function ($scope,
                $rootScope,
                $timeout,
                $filter,
                $modal,
                $log,
                notification,
                isCordova,
                profileService,
                lodash,
                configService,
                storageService,
                gettext,
                gettextCatalog,
                nodeWebkit,
                addressService,
                confirmDialog,
                animationService,
                addressbookService,
                correspondentListService,
                isMobile,
                ENV,
                migrationService,
                moment,
                exportTransactions) {
        migrationService.migrate();
        const constants = require('byteballcore/constants.js');
        const eventBus = require('byteballcore/event_bus.js');
        const breadcrumbs = require('byteballcore/breadcrumbs.js');
        const self = this;
        const conf = require('byteballcore/conf.js');
        $rootScope.hideMenuBar = false;
        $rootScope.wpInputFocused = false;
        const config = configService.getSync();
        const configWallet = config.wallet;
        const indexScope = $scope.index;
        $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;

        // INIT
        const walletSettings = configWallet.settings;
        this.unitValue = walletSettings.unitValue;
        this.unitName = walletSettings.unitName;
        this.unitDecimals = walletSettings.unitDecimals;
        this.isCordova = isCordova;
        this.addresses = [];
        this.isMobile = isMobile.any();
        this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
        this.blockUx = false;
        this.showScanner = false;
        this.isMobile = isMobile.any();
        this.addr = {};
        $scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js
        const disablePaymentRequestListener = $rootScope.$on('paymentRequest', (event, address, amount, asset, recipientDeviceAddress) => {
          console.log(`paymentRequest event ${address}, ${amount}`);
          $rootScope.$emit('Local/SetTab', 'send');
          self.setForm(address, amount, null, asset, recipientDeviceAddress);

          const form = $scope.sendForm;
          if (form.address.$invalid && !self.blockUx) {
            console.log('invalid address, resetting form');
            self.resetForm();
            self.error = gettextCatalog.getString('Could not recognize a valid Dagcoin QR Code');
          }
        });

        const disablePaymentUriListener = $rootScope.$on('paymentUri', (event, uri) => {
          $timeout(() => {
            $rootScope.$emit('Local/SetTab', 'send');
            self.setForm(uri);
          }, 100);
        });

        const disableAddrListener = $rootScope.$on('Local/NeedNewAddress', () => {
          self.setAddress(true);
        });

        const disableFocusListener = $rootScope.$on('Local/NewFocusedWallet', () => {
          self.addr = {};
          self.resetForm();
        });

        const disableResumeListener = $rootScope.$on('Local/Resume', () => {
          // This is needed then the apps go to sleep
          // looks like it already works ok without rebinding touch events after every resume
          // self.bindTouchDown();
        });

        const disableTabListener = $rootScope.$on('Local/TabChanged', (e, tab) => {
          // This will slow down switch, do not add things here!
          console.log(`tab changed ${tab}`);
          switch (tab) {
            case 'receive':
              // just to be sure we have an address
              self.setAddress();
              break;
            case 'walletHome':
              $scope.sendForm.$setPristine();
              self.resetForm();
              break;
            case 'send':
              $scope.sendForm.$setPristine();
              self.resetForm(() => {
                if ($rootScope.sendParams) {
                  if ($rootScope.sendParams.amount) {
                    $scope._amount = $rootScope.sendParams.amount;
                  }
                  if ($rootScope.sendParams.address) {
                    $scope._address = $rootScope.sendParams.address;
                  }
                  delete $rootScope.sendParams;
                }
              });

              break;
            default:
            // do nothing
          }
        });

        const disableOngoingProcessListener = $rootScope.$on('Addon/OngoingProcess', (e, name) => {
          self.setOngoingProcess(name);
        });

        function onNewWalletAddress(newAddress) {
          console.log(`==== NEW ADDRESSS ${newAddress}`);
          self.addr = {};
          self.setAddress();
        }

        eventBus.on('new_wallet_address', onNewWalletAddress);

        $scope.$on('$destroy', () => {
          console.log('walletHome $destroy');
          disableAddrListener();
          disablePaymentRequestListener();
          disablePaymentUriListener();
          disableTabListener();
          disableFocusListener();
          disableResumeListener();
          disableOngoingProcessListener();
          $rootScope.hideMenuBar = false;
          eventBus.removeListener('new_wallet_address', onNewWalletAddress);
        });

        // const accept_msg = gettextCatalog.getString('Accept');
        // const cancel_msg = gettextCatalog.getString('Cancel');
        // const confirm_msg = gettextCatalog.getString('Confirm');

        $scope.formatSum = (sum) => {
          const string = sum.toString().split('.');

          if (!string[1]) {
            return `${sum}.00`;
          }

          if (string[1] && string[1].length === 1) {
            return `${sum}0`;
          }
          return sum;
        };

        const today = moment().format('DD/MM/YYYY');
        const yesterday = moment().subtract(1, 'day').format('DD/MM/YYYY');

        $scope.formatDate = (value) => {
          if (value === today) {
            return 'Today';
          } else if (value === yesterday) {
            return 'Yesterday';
          }
          return value;
        };

        self.transactionAddress = (address) => {
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

        $scope.transactionStatus = (transaction) => {
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

        $scope.openDestinationAddressModal = function (wallets, address) {
          $rootScope.modalOpened = true;
          const fc = profileService.focusedClient;
          // self.resetForm();

          const ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.wallets = wallets;
            $scope.isMultiWallet = wallets.length > 0;
            $scope.selectedAddressbook = {};
            $scope.newAddress = address;
            $scope.addressbook = {
              address: ($scope.newAddress || ''),
              label: '',
            };
            $scope.color = fc.backgroundColor;
            $scope.bAllowAddressbook = self.canSendExternalPayment();
            $scope.selectedWalletsOpt = !!(wallets[0] || !$scope.bAllowAddressbook);

            $scope.selectAddressbook = function (addr) {
              $modalInstance.close(addr);
            };

            $scope.setWalletsOpt = function () {
              $scope.selectedWalletsOpt = !$scope.selectedWalletsOpt;
            };

            $scope.listEntries = function () {
              $scope.error = null;
              addressbookService.list((ab) => {
                const sortedContactArray = lodash.sortBy(ab, (contact) => {
                  const favoriteCharacter = contact.favorite === true ? '!' : '';
                  const fullName = `${contact.first_name}${contact.last_name}`.toUpperCase();
                  return `${favoriteCharacter}${fullName}`;
                });
                $scope.list = {};
                lodash.forEach(sortedContactArray, (contact) => {
                  $scope.list[contact.address] = contact;
                });
              });
            };

            $scope.$watch('addressbook.label', (value) => {
              if (value && value.length > 16) {
                $scope.addressbook.label = value.substr(0, 16);
              }
            });

            $scope.cancel = function () {
              breadcrumbs.add('openDestinationAddressModal cancel');
              $modalInstance.dismiss('cancel');
            };

            $scope.selectWallet = function (walletId, walletName) {
              $scope.selectedWalletName = walletName;
              addressService.getAddress(walletId, false, (err, addr) => {
                $scope.gettingAddress = false;

                if (err) {
                  self.error = err;
                  breadcrumbs.add(`openDestinationAddressModal getAddress err: ${err}`);
                  $modalInstance.dismiss('cancel');
                  return;
                }

                $modalInstance.close(addr);
              });
            };
          };

          const modalInstance = $modal.open({
            templateUrl: 'views/modals/destination-address.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
          });

          const disableCloseModal = $rootScope.$on('closeModal', () => {
            breadcrumbs.add('openDestinationAddressModal on closeModal');
            modalInstance.dismiss('cancel');
          });

          modalInstance.result.finally(() => {
            $rootScope.modalOpened = false;
            disableCloseModal();
            const m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
          });

          modalInstance.result.then((addr) => {
            if (addr) {
              self.setToAddress(addr);
            }
          });
        };

        $scope.openSharedAddressDefinitionModal = function (address) {
          $rootScope.modalOpened = true;
          const fc = profileService.focusedClient;

          const ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.color = fc.backgroundColor;
            $scope.address = address;

            const walletGeneral = require('byteballcore/wallet_general.js');
            const walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
            walletGeneral.readMyAddresses((arrMyAddresses) => {
              walletDefinedByAddresses.readSharedAddressDefinition(address, (arrDefinition, creationTs) => {
                $scope.humanReadableDefinition = correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], true);
                $scope.creation_ts = creationTs;
                walletDefinedByAddresses.readSharedAddressCosigners(address, (cosigners) => {
                  $scope.cosigners = cosigners.map(cosigner => cosigner.name).join(', ');
                  $scope.$apply();
                });
              });
            });

            // clicked a link in the definition
            $scope.sendPayment = function (receiverAddress, amount, asset) {
              if (asset && indexScope.arrBalances.filter(balance => (balance.asset === asset)).length === 0) {
                return console.log(`i do not own anything of asset ${asset}`);
              }
              $modalInstance.dismiss('done');
              return $timeout(() => {
                indexScope.shared_address = null;
                indexScope.updateAll();
                indexScope.updateTxHistory();
                $rootScope.$emit('paymentRequest', receiverAddress, amount, asset);
              });
            };

            $scope.cancel = function () {
              breadcrumbs.add('openSharedAddressDefinitionModal cancel');
              $modalInstance.dismiss('cancel');
            };
          };

          const modalInstance = $modal.open({
            templateUrl: 'views/modals/address-definition.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
          });

          const disableCloseModal = $rootScope.$on('closeModal', () => {
            breadcrumbs.add('openSharedAddressDefinitionModal on closeModal');
            modalInstance.dismiss('cancel');
          });

          modalInstance.result.finally(() => {
            $rootScope.modalOpened = false;
            disableCloseModal();
            const m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
          });
        };

        this.exportTransactions = () => {
          exportTransactions.toCSV();
        };

        this.openTxpModal = function () {
          // deleted, maybe restore from copay sometime later
          // actually, nothing to display here that was not already shown
        };

        this.setAddress = function (forceNew) {
          self.addrError = null;
          const fc = profileService.focusedClient;
          if (!fc) {
            return;
          }

          // Address already set?
          if (!forceNew && self.addr[fc.credentials.walletId]) {
            return;
          }

          if (indexScope.shared_address && forceNew) {
            throw Error('attempt to generate for shared address');
          }

          if (fc.isSingleAddress && forceNew) {
            throw Error('attempt to generate for single address wallets');
          }

          self.generatingAddress = true;
          $timeout(() => {
            addressService.getAddress(fc.credentials.walletId, forceNew, (err, addr) => {
              self.generatingAddress = false;

              if (err) {
                self.addrError = err;
              } else if (addr) {
                self.addr[fc.credentials.walletId] = addr;
              }

              $timeout(() => {
                $scope.$digest();
              });
            });
          });
        };

        this.copyAddress = function (addr) {
          if (isCordova) {
            window.cordova.plugins.clipboard.copy(addr);
            window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
          } else if (nodeWebkit.isDefined()) {
            nodeWebkit.writeToClipboard(addr);
          }

          $scope.tooltipCopiedShown = true;

          $timeout(() => {
            $scope.tooltipCopiedShown = false;
          }, 1000);
        };

        this.shareAddress = function (addr) {
          if (isCordova) {
            if (isMobile.Android() || isMobile.Windows()) {
              window.ignoreMobilePause = true;
            }
            window.plugins.socialsharing.share(addr, null, null, null);
          }
        };

        this.openCustomizedAmountModal = function (addr) {
          $rootScope.modalOpened = true;
          const self = this;
          const fc = profileService.focusedClient;
          const ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.addr = addr;
            $scope.color = fc.backgroundColor;
            $scope.unitName = self.unitName;
            $scope.unitValue = self.unitValue;
            $scope.unitDecimals = self.unitDecimals;
            $scope.isCordova = isCordova;
            $scope.buttonLabel = gettextCatalog.getString('Generate QR Code');
            $scope.protocol = conf.program;

            Object.defineProperty($scope, '_customAmount', {
              get() {
                return $scope.customAmount;
              },
              set(newValue) {
                $scope.customAmount = newValue;
              },
              enumerable: true,
              configurable: true,
            });

            $scope.submitForm = function (form) {
              if ($scope.index.arrBalances.length === 0) {
                return console.log('openCustomizedAmountModal: no balances yet');
              }
              const amount = form.amount.$modelValue;
              const amountInSmallestUnits = parseInt((amount * $scope.unitValue).toFixed(0));

              return $timeout(() => {
                $scope.customizedAmountUnit = `${amount} ${$scope.unitName}`;
                $scope.amountInSmallestUnits = amountInSmallestUnits;
                $scope.asset_param = '';
              }, 1);
            };

            $scope.shareAddress = function (uri) {
              if (isMobile.Android()) {
                window.ignoreMobilePause = true;
              }
              window.plugins.socialsharing.share(uri, null, null, null);
            };

            $scope.cancel = function () {
              breadcrumbs.add('openCustomizedAmountModal: cancel');
              $modalInstance.dismiss('cancel');
            };
          };

          const modalInstance = $modal.open({
            templateUrl: 'views/modals/customized-amount.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
            scope: $scope,
          });

          const disableCloseModal = $rootScope.$on('closeModal', () => {
            breadcrumbs.add('openCustomizedAmountModal: on closeModal');
            modalInstance.dismiss('cancel');
          });

          modalInstance.result.finally(() => {
            $rootScope.modalOpened = false;
            disableCloseModal();
            const m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
          });
        };

        // Send

        const unwatchSpendUnconfirmed = $scope.$watch('currentSpendUnconfirmed', (newVal, oldVal) => {
          if (newVal === oldVal) return;
          $scope.currentSpendUnconfirmed = newVal;
        });

        $scope.$on('$destroy', () => {
          unwatchSpendUnconfirmed();
        });

        this.resetError = function () {
          this.error = null;
          this.success = null;
        };

        this.bindTouchDown = function (tries) {
          const self = this;
          let touchDownTries = tries || 0;
          if (touchDownTries > 5) return;
          const e = document.getElementById('menu-walletHome');
          if (!e) {
            $timeout(() => {
              self.bindTouchDown(++touchDownTries);
            }, 500);
          }

          // on touchdown elements
          $log.debug('Binding touchstart elements...');
          ['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive', 'menu-history'].forEach((id) => {
            const e = document.getElementById(id);
            if (e) {
              e.addEventListener('touchstart', () => {
                try {
                  event.preventDefault();
                } catch (e) {
                  // continue regardless of error
                }
                angular.element(e).triggerHandler('click');
              }, true);
            }
          });
        };

        this.hideMenuBar = lodash.debounce(function (hide) {
          if (hide) {
            $rootScope.hideMenuBar = true;
            this.bindTouchDown();
          } else {
            $rootScope.hideMenuBar = false;
          }
          $rootScope.$digest();
        }, 100);

        this.formFocus = function (what) {
          if (isCordova && !this.isWindowsPhoneApp) {
            this.hideMenuBar(what);
          }
          if (!this.isWindowsPhoneApp) return;

          if (!what) {
            this.hideAddress = false;
            this.hideAmount = false;
          } else if (what === 'amount') {
            this.hideAddress = true;
          } else if (what === 'msg') {
            this.hideAddress = true;
            this.hideAmount = true;
          }
          $timeout(() => {
            $rootScope.$digest();
          }, 1);
        };

        this.setSendFormInputs = function () {
          /**
           * Setting the two related amounts as properties prevents an infinite
           * recursion for watches while preserving the original angular updates
           *
           */
          Object.defineProperty($scope,
            '_amount', {
              get() {
                return $scope.__amount;
              },
              set(newValue) {
                $scope.__amount = newValue;
                self.resetError();
              },
              enumerable: true,
              configurable: true,
            });

          Object.defineProperty($scope,
            '_address', {
              get() {
                return $scope.__address;
              },
              set(newValue) {
                $scope.__address = self.onAddressChange(newValue);
                if ($scope.sendForm && $scope.sendForm.address.$valid) {
                  self.lockAddress = true;
                }
              },
              enumerable: true,
              configurable: true,
            });

          // const fc = profileService.focusedClient;
          // ToDo: use a credential's (or fc's) function for this
          this.hideNote = true;
        };

        this.setSendError = function (err) {
          const fc = profileService.focusedClient;
          const prefix =
            fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');

          this.error = `${prefix}: ${err}`;
          console.log(this.error);

          $timeout(() => {
            $scope.$digest();
          }, 1);
        };

        this.setOngoingProcess = function (name) {
          const self = this;
          self.blockUx = !!name;

          if (isCordova) {
            if (name) {
              window.plugins.spinnerDialog.hide();
              window.plugins.spinnerDialog.show(null, `${name}...`, true);
            } else {
              window.plugins.spinnerDialog.hide();
            }
          } else {
            self.onGoingProcess = name;
            $timeout(() => {
              $rootScope.$apply();
            });
          }
        };

        this.submitForm = function () {
          if ($scope.index.arrBalances.length === 0) {
            return console.log('send payment: no balances yet');
          }
          const fc = profileService.focusedClient;
          const unitValue = this.unitValue;

          if (isCordova && this.isWindowsPhoneApp) {
            this.hideAddress = false;
            this.hideAmount = false;
          }

          const form = $scope.sendForm;
          if (!form) {
            return console.log('form is gone');
          }
          if (form.$invalid) {
            this.error = gettextCatalog.getString('Unable to send transaction proposal');
            return;
          }
          if (fc.isPrivKeyEncrypted()) {
            profileService.unlockFC(null, (err) => {
              if (err) {
                return self.setSendError(err.message);
              }
              return self.submitForm();
            });
            return;
          }

          /* var comment = form.comment.$modelValue;
           // ToDo: use a credential's (or fc's) function for this
           if (comment) {
           var msg = 'Could not add message to imported wallet without shared encrypting key';
           $log.warn(msg);
           return self.setSendError(gettext(msg));
           } */

          const asset = 'base';
          console.log(`asset ${asset}`);
          const address = form.address.$modelValue;
          const recipientDeviceAddress = assocDeviceAddressesByPaymentAddress[address];
          let amount = form.amount.$modelValue;
          const paymentId = form.paymentId ? form.paymentId.$modelValue : null;
          // const paymentId = 1;
          let merkleProof = '';
          if (form.merkle_proof && form.merkle_proof.$modelValue) {
            merkleProof = form.merkle_proof.$modelValue.trim();
          }
          amount *= unitValue;
          amount = Math.round(amount);

          const currentPaymentKey = `${asset}${address}${amount}`;
          if (currentPaymentKey === self.current_payment_key) {
            return $rootScope.$emit('Local/ShowErrorAlert', 'This payment is being processed');
          }
          self.current_payment_key = currentPaymentKey;

          indexScope.setOngoingProcess(gettextCatalog.getString('sending'), true);
          $timeout(() => {
            profileService.requestTouchid(null, (err) => {
              if (err) {
                profileService.lockFC();
                indexScope.setOngoingProcess(gettextCatalog.getString('sending'), false);
                self.error = err;
                $timeout(() => {
                  delete self.current_payment_key;
                  $scope.$digest();
                }, 1);
                return;
              }
              let myAddress;
              const device = require('byteballcore/device.js');
              const walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
              if (self.binding) {
                if (!recipientDeviceAddress) {
                  throw Error(gettextCatalog.getString('recipient device address not known'));
                }
                const walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');

                // never reuse addresses as the required output could be already present
                walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, (addressInfo) => {
                  myAddress = addressInfo.address;
                  let arrDefinition;
                  let assocSignersByPath;
                  if (self.binding.type === 'reverse_payment') {
                    const arrSeenCondition = ['seen', {
                      what: 'output',
                      address: myAddress,
                      asset: 'base',
                      amount: self.binding.reverseAmount,
                    }];
                    arrDefinition = ['or', [
                      ['and', [
                        ['address', address],
                        arrSeenCondition,
                      ]],
                      ['and', [
                        ['address', myAddress],
                        ['not', arrSeenCondition],
                        ['in data feed', [[ENV.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout * 3600 * 1000)]],
                      ]],
                    ]];
                    assocSignersByPath = {
                      'r.0.0': {
                        address,
                        member_signing_path: 'r',
                        device_address: recipientDeviceAddress,
                      },
                      'r.1.0': {
                        address: myAddress,
                        member_signing_path: 'r',
                        device_address: device.getMyDeviceAddress(),
                      },
                    };
                  } else {
                    const arrExplicitEventCondition = ['in data feed', [[self.binding.oracle_address], self.binding.feed_name, '=', self.binding.feed_value]];
                    const arrMerkleEventCondition = ['in merkle', [[self.binding.oracle_address], self.binding.feed_name, self.binding.feed_value]];
                    let arrEventCondition;
                    if (self.binding.feed_type === 'explicit') {
                      arrEventCondition = arrExplicitEventCondition;
                    } else if (self.binding.feed_type === 'merkle') {
                      arrEventCondition = arrMerkleEventCondition;
                    } else if (self.binding.feed_type === 'either') {
                      arrEventCondition = ['or', [arrMerkleEventCondition, arrExplicitEventCondition]];
                    } else {
                      throw Error(`unknown feed type: ${self.binding.feed_type}`);
                    }
                    arrDefinition = ['or', [
                      ['and', [['address', address], arrEventCondition]],
                      ['and', [
                        ['address', myAddress], ['in data feed', [[ENV.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout * 3600 * 1000)]]
                      ]]
                    ]];
                    assocSignersByPath = {
                      'r.0.0': {
                        address,
                        member_signing_path: 'r',
                        device_address: recipientDeviceAddress,
                      },
                      'r.1.0': {
                        address: myAddress,
                        member_signing_path: 'r',
                        device_address: device.getMyDeviceAddress(),
                      },
                    };
                    if (self.binding.feed_type === 'merkle' || self.binding.feed_type === 'either') {
                      assocSignersByPath[(self.binding.feed_type === 'merkle') ? 'r.0.1' : 'r.0.1.0'] = {
                        address: '',
                        member_signing_path: 'r',
                        device_address: recipientDeviceAddress,
                      };
                    }
                  }
                  walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
                    ifError(err) {
                      delete self.current_payment_key;
                      indexScope.setOngoingProcess(gettextCatalog.getString('sending'), false);
                      self.setSendError(err);
                    },
                    ifOk(sharedAddress) {
                      composeAndSend(sharedAddress);
                    },
                  });
                });
              } else {
                composeAndSend(address);
              }

              // compose and send
              function composeAndSend(toAddress) {
                let arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
                let opts = {};
                if (fc.credentials.m < fc.credentials.n) {
                  $scope.index.copayers.forEach((copayer) => {
                    if (copayer.me || copayer.signs) {
                      arrSigningDeviceAddresses.push(copayer.device_address);
                    }
                  });
                } else if (indexScope.shared_address) {
                  arrSigningDeviceAddresses = indexScope.copayers.map(copayer => copayer.device_address);
                }

                breadcrumbs.add(`sending payment in ${asset}`);
                profileService.bKeepUnlocked = true;

                opts = {
                  shared_address: indexScope.shared_address,
                  merkleProof,
                  asset,
                  to_address: toAddress,
                  amount,
                  send_all: false,
                  arrSigningDeviceAddresses,
                  recipientDeviceAddress,
                };

                fc.sendMultiPayment(opts, (sendMultiPaymentError) => {
                  let error = sendMultiPaymentError;
                  // if multisig, it might take very long before the callback is called
                  indexScope.setOngoingProcess(gettextCatalog.getString('sending'), false);
                  breadcrumbs.add(`done payment in ${asset}, err=${sendMultiPaymentError}`);
                  delete self.current_payment_key;
                  profileService.bKeepUnlocked = false;
                  if (sendMultiPaymentError) {
                    if (sendMultiPaymentError.match(/no funded/) || sendMultiPaymentError.match(/not enough asset coins/)) {
                      error = gettextCatalog.getString('Not enough dagcoins');
                    } else if (sendMultiPaymentError.match(/connection closed/) || sendMultiPaymentError.match(/connect to light vendor failed/)) {
                      error = gettextCatalog.getString('Problems with connecting to the hub. Please try again later');
                    }
                    return self.setSendError(error);
                  }
                  const binding = self.binding;
                  self.resetForm();
                  $rootScope.$emit('NewOutgoingTx');
                  if (recipientDeviceAddress) { // show payment in chat window
                    eventBus.emit('sent_payment', recipientDeviceAddress, amount || 'all', asset, indexScope.walletId, true, toAddress);
                    if (binding && binding.reverseAmount) { // create a request for reverse payment
                      if (!myAddress) {
                        throw Error(gettextCatalog.getString('my address not known'));
                      }
                      const paymentRequestCode = `byteball:${myAddress}?amount=${binding.reverseAmount}&asset=${encodeURIComponent(binding.reverseAsset)}`;
                      const paymentRequestText = `[reverse payment](${paymentRequestCode})`;
                      device.sendMessageToDevice(recipientDeviceAddress, 'text', paymentRequestText);
                      correspondentListService.messageEventsByCorrespondent[recipientDeviceAddress].push({
                        bIncoming: false,
                        message: correspondentListService.formatOutgoingMessage(paymentRequestText),
                        timestamp: Math.floor(Date.now() / 1000)
                      });
                      // issue next address to avoid reusing the reverse payment address
                      if (!fc.isSingleAddress) {
                        walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, () => {
                        });
                      }
                    }
                  } else {
                    indexScope.updateHistory((success) => {
                      if (success) {
                        $rootScope.$emit('Local/SetTab', 'walletHome');
                        self.openTxModal(indexScope.txHistory[0], indexScope.txHistory);
                      } else {
                        console.error('updateTxHistory not executed');
                      }
                    });
                  }
                });
              }
            });
          }, 100);
        };

        let assocDeviceAddressesByPaymentAddress = {};

        this.canSendExternalPayment = function () {
          if ($scope.index.arrBalances.length === 0) {
            // no balances yet, assume can send
            return true;
          }
          if (!$scope.index.arrBalances[$scope.index.assetIndex].is_private) {
            return true;
          }
          const form = $scope.sendForm;
          if (!form || !form.address) {
            // disappeared
            return true;
          }
          const address = form.address.$modelValue;
          const recipientDeviceAddress = assocDeviceAddressesByPaymentAddress[address];
          return !!recipientDeviceAddress;
        };

        this.deviceAddressIsKnown = function () {
          // return true;
          if ($scope.index.arrBalances.length === 0) {
            // no balances yet
            return false;
          }
          const form = $scope.sendForm;
          if (!form || !form.address) {
            // disappeared
            return false;
          }
          const address = form.address.$modelValue;
          const recipientDeviceAddress = assocDeviceAddressesByPaymentAddress[address];
          return !!recipientDeviceAddress;
        };

        this.openBindModal = function () {
          $rootScope.modalOpened = true;
          const fc = profileService.focusedClient;
          const form = $scope.sendForm;
          if (!form || !form.address) {
            // disappeared
            return;
          }

          const ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.color = fc.backgroundColor;
            $scope.arrPublicAssetInfos = indexScope.arrBalances.filter(b => !b.is_private).map((b) => {
              const r = { asset: b.asset, displayName: self.unitName };
              return r;
            });
            $scope.binding = { // defaults
              type: 'reverse_payment',
              timeout: 4,
              reverseAsset: 'base',
              feed_type: 'either',
              oracle_address: ''
            };
            if (self.binding) {
              $scope.binding.type = self.binding.type;
              $scope.binding.timeout = self.binding.timeout;
              if (self.binding.type === 'reverse_payment') {
                $scope.binding.reverseAsset = self.binding.reverseAsset;
                $scope.binding.reverseAmount = getAmountInDisplayUnits(self.binding.reverseAmount, self.binding.reverseAsset);
              } else {
                $scope.binding.oracle_address = self.binding.oracle_address;
                $scope.binding.feed_name = self.binding.feed_name;
                $scope.binding.feed_value = self.binding.feed_value;
                $scope.binding.feed_type = self.binding.feed_type;
              }
            }

            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };

            $scope.bind = function () {
              const binding = { type: $scope.binding.type };
              if (binding.type === 'reverse_payment') {
                binding.reverseAsset = $scope.binding.reverseAsset;
                binding.reverseAmount = getAmountInSmallestUnits($scope.binding.reverseAmount, $scope.binding.reverseAsset);
              } else {
                binding.oracle_address = $scope.binding.oracle_address;
                binding.feed_name = $scope.binding.feed_name;
                binding.feed_value = $scope.binding.feed_value;
                binding.feed_type = $scope.binding.feed_type;
              }
              binding.timeout = $scope.binding.timeout;
              self.binding = binding;
              $modalInstance.dismiss('done');
            };
          };

          const modalInstance = $modal.open({
            templateUrl: 'views/modals/bind.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
          });

          const disableCloseModal = $rootScope.$on('closeModal', () => {
            modalInstance.dismiss('cancel');
          });

          modalInstance.result.finally(() => {
            $rootScope.modalOpened = false;
            disableCloseModal();
            const m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
          });
        };

        function getAmountInSmallestUnits(amount, asset) {
          console.log(amount, asset, self.unitValue);
          const moneyAmount = amount * self.unitValue;
          return Math.round(moneyAmount);
        }

        function getAmountInDisplayUnits(amount) {
          return amount / self.unitValue;
        }

        this.setToAddress = function (to) {
          const form = $scope.sendForm;
          if (!form || !form.address) {
            // disappeared?
            return console.log('form.address has disappeared');
          }
          form.address.$setViewValue(to);
          form.address.$isValid = true;
          form.address.$render();
          this.lockAddress = true;
        };

        this.setForm = function (to, amount, comment, asset, recipientDeviceAddress) {
          this.resetError();
          delete this.binding;
          const form = $scope.sendForm;
          let moneyAmount = amount;
          if (!form || !form.address) {
            // disappeared?
            return console.log('form.address has disappeared');
          }
          if (to) {
            form.address.$setViewValue(to);
            form.address.$isValid = true;
            form.address.$render();
            this.lockAddress = true;
            if (recipientDeviceAddress) {
              // must be already paired
              assocDeviceAddressesByPaymentAddress[to] = recipientDeviceAddress;
            }
          }

          if (moneyAmount) {
            moneyAmount /= this.unitValue;
            // form.amount.$setViewValue("" + amount);
            // form.amount.$isValid = true;
            this.lockAmount = true;
            $timeout(() => {
              form.amount.$setViewValue(`${moneyAmount}`);
              form.amount.$isValid = true;
              form.amount.$render();

              form.address.$setViewValue(to);
              form.address.$isValid = true;
              form.address.$render();
            }, 300);
          } else {
            this.lockAmount = false;
            form.amount.$pristine = true;
            form.amount.$setViewValue('');
            form.amount.$render();
          }
          // form.amount.$render();

          if (form.merkle_proof) {
            form.merkle_proof.$setViewValue('');
            form.merkle_proof.$render();
          }
          if (comment) {
            form.comment.$setViewValue(comment);
            form.comment.$isValid = true;
            form.comment.$render();
          }

          if (asset) {
            const assetIndex = lodash.findIndex($scope.index.arrBalances, { asset });
            if (assetIndex < 0) {
              throw Error(gettextCatalog.getString(`failed to find asset index of asset ${asset}`));
            }
            $scope.index.assetIndex = assetIndex;
            this.lockAsset = true;
          } else {
            this.lockAsset = false;
          }
        };

        this.resetForm = function (cb) {
          this.resetError();
          delete this.binding;

          this.lockAsset = false;
          this.lockAddress = false;
          this.lockAmount = false;
          this.hideAdvSend = true;
          $scope.currentSpendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;

          this._amount = null;
          this._address = null;
          this.bSendAll = false;

          const form = $scope.sendForm;

          if (form && form.amount) {
            form.amount.$pristine = true;
            form.amount.$setViewValue('');
            if (form.amount) {
              form.amount.$render();
            }

            if (form.merkle_proof) {
              form.merkle_proof.$setViewValue('');
              form.merkle_proof.$render();
            }
            if (form.comment) {
              form.comment.$setViewValue('');
              form.comment.$render();
            }
            form.$setPristine();

            if (form.address) {
              form.address.$pristine = true;
              form.address.$setViewValue('');
              form.address.$render();
            }
          }
          $timeout(() => {
            if (cb) {
              cb();
            }
            $rootScope.$digest();
          }, 1);
        };

        this.setSendAll = function () {
          const form = $scope.sendForm;
          if (!form || !form.amount || indexScope.arrBalances.length === 0) {
            return;
          }
          let available = indexScope.baseBalance.stable;
          available /= this.unitValue;
          form.amount.$setViewValue(`${available}`);
          form.amount.$render();
        };

        this.setFromUri = function (uri) {
          let objRequest;
          require('byteballcore/uri.js').parseUri(uri, {
            ifError() {
            },
            ifOk(_objRequest) {
              objRequest = _objRequest; // the callback is called synchronously
            },
          });

          if (!objRequest) {
            // failed to parse
            return uri;
          }
          if (objRequest.amount) {
            // setForm() cares about units conversion
            // var amount = (objRequest.amount / this.unitValue).toFixed(this.unitDecimals);
            this.setForm(objRequest.address, objRequest.amount);
          }
          return objRequest.address;
        };

        this.onAddressChange = function (value) {
          this.resetError();
          if (!value) return '';

          return value;
        };

        // History

        function strip(number) {
          return (parseFloat(number.toPrecision(12)));
        }

        this.getUnitName = function () {
          return this.unitName;
        };

        this.openTxModal = function (btx, txHistory) {
          console.log(btx);
          $rootScope.modalOpened = true;
          const self = this;
          const fc = profileService.focusedClient;
          const ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.btx = btx;
            const assetIndex = lodash.findIndex(indexScope.arrBalances, { asset: btx.asset });
            $scope.isPrivate = indexScope.arrBalances[assetIndex].is_private;
            $scope.settings = walletSettings;
            $scope.color = fc.backgroundColor;

            $scope.getAmount = function (amount) {
              return self.getAmount(amount);
            };

            $scope.getUnitName = function () {
              return self.getUnitName();
            };

            $scope.transactionAddress = self.transactionAddress;

            $scope.openInExplorer = function () {
              const url = `https://${ENV.explorerPrefix}explorer.dagcoin.org/#${btx.unit}`;
              if (typeof nw !== 'undefined') {
                nw.Shell.openExternal(url);
              } else if (isCordova) {
                cordova.InAppBrowser.open(url, '_system');
              }
            };

            $scope.copyAddress = function (addr) {
              if (!addr) return;
              self.copyAddress(addr);
            };

            $scope.showCorrespondentList = function () {
              self.showCorrespondentListToReSendPrivPayloads(btx);
            };

            $scope.cancel = function () {
              breadcrumbs.add('dismiss tx details');
              try {
                $modalInstance.dismiss('cancel');
              } catch (e) {
                // indexScope.sendBugReport('simulated in dismiss tx details', e);
              }
            };
          };

          const modalInstance = $modal.open({
            templateUrl: 'views/modals/tx-details.html',
            windowClass: 'modal-transaction-detail',
            controller: ModalInstanceCtrl,
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

        $rootScope.openTxModal = (transaction, rows) => {
          this.openTxModal(transaction, rows);
        };

        this.showCorrespondentListToReSendPrivPayloads = function (btx) {
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

        this.hasAction = function (actions) {
          return Object.prototype.hasOwnProperty.call(actions, 'create');
        };

        /* Start setup */

        this.getFontSizeForWalletNumber = (value, type) => {
          if (value) {
            const visibleWidth = window.innerWidth - 50;
            const str = value.toString().split('.');

            const length = str[0].length + ((str[1] || 0).length / 2);
            const size = ((visibleWidth / length) < 70 ? ((visibleWidth / length) + 10) : 80);

            return { 'font-size': `${(!type ? size : size / 2)}px` };
          }
          return { 'font-size': '80px' };
        };

        this.bindTouchDown();
        if (profileService.focusedClient) {
          this.setAddress();
          this.setSendFormInputs();
        }
      });
}());
