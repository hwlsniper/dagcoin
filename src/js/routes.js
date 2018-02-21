/* eslint-disable import/no-extraneous-dependencies,import/no-unresolved */
(function () {
  'use strict';

  let unsupported;
  let isaosp;

  if (window && window.navigator) {
    const rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
    isaosp = (rxaosp && rxaosp[1] < 537);
    if (!window.cordova && isaosp) {
      unsupported = true;
    }
    if (unsupported) {
      window.location = '#/unsupported';
    }
  }

// Setting up route
  angular
    .module('copayApp')
    .config((historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, ScrollBarsProvider, ngDialogProvider) => {
      ScrollBarsProvider.defaults = {
        autoHideScrollbar: true,
        scrollButtons: {
          scrollAmount: 'auto',
          enable: true
        },
        scrollInertia: 400,
        theme: 'dark',
        advanced: {
          updateOnContentResize: true
        },
        axis: 'y'
      };

      ngDialogProvider.setDefaults({
        showClose: false,
        closeByDocument: true,
        closeByEscape: true,
        closeByNavigation: true
      });

      $urlRouterProvider.otherwise('/');

      $logProvider.debugEnabled(true);
      $provide.decorator('$log', ['$delegate',
        function ($delegate) {
          const historicLog = historicLogProvider.$get();

          ['debug', 'info', 'warn', 'error', 'log'].forEach((level) => {
            const orig = $delegate[level];
            $delegate[level] = function (...argz) {
              if (level === 'error') {
                console.log(argz);
              }

              let args = [].slice.call(argz);
              if (!Array.isArray(args)) args = [args];
              args = args.map((v) => {
                let value = v;
                try {
                  if (typeof value === 'undefined') {
                    value = 'undefined';
                  }
                  if (!value) {
                    value = 'null';
                  }
                  if (typeof value === 'object') {
                    if (value.message) {
                      value = value.message;
                    } else {
                      value = JSON.stringify(value);
                    }
                  }
                  // Trim output in mobile
                  if (window.cordova) {
                    value = value.toString();
                    if (value.length > 1000) {
                      value = `${value.substr(0, 997)}...`;
                    }
                  }
                } catch (e) {
                  console.log('Error at log decorator:', e);
                  value = 'undefined';
                }
                return value;
              });
              try {
                if (window.cordova) {
                  console.log(args.join(' '));
                }
                historicLog.add(level, args.join(' '));
                orig(...args);
              } catch (e) {
                console.log('ERROR (at log decorator):', e, args[0]);
              }
            };
          });
          return $delegate;
        },
      ]);

      // whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
      // link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);

      $stateProvider
        .state('splash', {
          url: '/splash',
          needProfile: false,
          views: {
            main: {
              templateUrl: 'views/splash.html',
            },
          },
        })
        .state('intro', {
          url: '/intro',
          needProfile: false,
          views: {
            main: {
              templateUrl: 'controllers/intro/intro.template.html',
              controller: 'IntroController'
            }
          }
        })
        .state('intro_confirm', {
          url: '/intro_confirm',
          needProfile: false,
          views: {
            main: {
              templateUrl: 'controllers/intro_confirm/intro_confirm.template.html',
              controller: 'IntroConfirmController'
            }
          }
        })
        .state('translators', {
          url: '/translators',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/translators.html',
            },
          },
        })
        .state('disclaimer', {
          url: '/disclaimer',
          needProfile: false,
          views: {
            main: {
              templateUrl: 'views/disclaimer.html',
              controller: 'disclaimerController'
            }
          }
        })
        .state('walletHome', {
          url: '/',
          walletShouldBeComplete: true,
          needProfile: true,
          deepStateRedirect: true,
          sticky: true,
          views: {
            main: {
              templateUrl: 'views/walletHome.html',
              controller: 'walletHomeController as home'
            },
          },
        })
        .state('unsupported', {
          url: '/unsupported',
          needProfile: false,
          views: {
            main: {
              templateUrl: 'views/unsupported.html',
            }
          }
        })
        .state('payment', {
          url: '/uri-payment/:data',
          templateUrl: 'views/paymentUri.html',
          views: {
            main: {
              templateUrl: 'views/paymentUri.html'
            }
          },
          needProfile: true,
        })
        .state('selectWalletForPayment', {
          url: '/selectWalletForPayment',
          controller: 'walletForPaymentController',
          needProfile: true,
        })
        .state('importProfile', {
          url: '/importProfile',
          templateUrl: 'views/importProfile.html',
          needProfile: false,
        })
        .state('importLegacy', {
          url: '/importLegacy',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/importLegacy.html',
            },
          },

        })
        .state('create', {
          url: '/create',
          templateUrl: 'views/create.html',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/create.html',
            },
          },
        })
        .state('copayers', {
          url: '/copayers',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/copayers.html',
            },
          },
        })
        .state('preferences', {
          url: '/preferences',
          templateUrl: 'views/preferences.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferences.html',
              controller: 'preferencesController as preferences'
            },
          },
        })
        .state('correspondentDevices', {
          url: '/correspondentDevices',
          walletShouldBeComplete: false,
          needProfile: true,
          deepStateRedirect: true,
          sticky: true,
          views: {
            main: {
              templateUrl: 'views/correspondentDevices.html',
              controller: 'correspondentDevicesController'
            },
          },
        })
        .state('correspondentDevice', {
          url: '/correspondentDevice',
          walletShouldBeComplete: false,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/correspondentDevice.html',
              controller: 'correspondentDeviceController'
            },
          },
        })
        .state('editCorrespondentDevice', {
          url: '/editCorrespondentDevice',
          walletShouldBeComplete: false,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/editCorrespondentDevice.html',
              controller: 'editCorrespondentDeviceController'
            },
          },
        })
        .state('addCorrespondentDevice', {
          url: '/addCorrespondentDevice',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/addCorrespondentDevice.html',
            },
          },
        })
        .state('inviteCorrespondentDevice', {
          url: '/inviteCorrespondentDevice',
          walletShouldBeComplete: false,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/inviteCorrespondentDevice.html',
              controller: 'inviteCorrespondentDeviceController'
            },
          },
        })
        .state('acceptCorrespondentInvitation', {
          url: '/acceptCorrespondentInvitation',
          walletShouldBeComplete: false,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/acceptCorrespondentInvitation.html',
              controller: 'acceptCorrespondentInvitationController'
            },
          },
        })
        .state('authConfirmation', {
          url: '/authConfirmation',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/authConfirmation.html',
            },
          },
        })
        .state('preferencesDeviceName', {
          url: '/preferencesDeviceName',
          walletShouldBeComplete: false,
          needProfile: false,
          views: {
            main: {
              templateUrl: 'views/preferencesDeviceName.html',
            },
          },
        })
        .state('preferencesLanguage', {
          url: '/preferencesLanguage',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesLanguage.html',
              controller: 'preferencesLanguageController as prefLang'
            },
          },
        })

        .state('preferencesAdvanced', {
          url: '/preferencesAdvanced',
          templateUrl: 'views/preferencesAdvanced.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesAdvanced.html',
            },
          },
        })
        .state('preferencesDeleteWallet', {
          url: '/delete',
          templateUrl: 'views/preferencesDeleteWallet.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            'main@': {
              templateUrl: 'views/preferencesDeleteWallet.html'
            },
          }
        })
        .state('preferencesColor', {
          url: '/preferencesColor',
          templateUrl: 'views/preferencesColor.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesColor.html',
            },
          },
        })

        .state('preferencesAlias', {
          url: '/preferencesAlias',
          templateUrl: 'views/preferencesAlias.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesAlias.html',
            },

          },
        })
        .state('preferencesEmail', {
          url: '/preferencesEmail',
          templateUrl: 'views/preferencesEmail.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesEmail.html',
            },

          },
        })
        .state('information', {
          url: '/information',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesInformation.html',
              controller: 'preferencesInformation as info'
            },
          },
        })
        .state('system', {
          url: '/system',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesSystem.html',
            },
          },
        })
        .state('security', {
          url: '/security',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesSecurity.html',
            },
          },
        })

        .state('about', {
          url: '/about',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesAbout.html',
            },
          },
        })
        .state('aboutDevice', {
          url: '/aboutDevice',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesAboutDevice.html',
            },
          },
        })
        .state('logs', {
          url: '/logs',
          templateUrl: 'views/preferencesLogs.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesLogs.html',
              controller: 'preferencesLogs as logs'
            },
          },
        })
        .state('paperWallet', {
          url: '/paperWallet',
          templateUrl: 'views/paperWallet.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/paperWallet.html',
            },
          },
        })
        .state('backup', {
          url: '/backup',
          params: {
            backTo: 'security'
          },
          templateUrl: 'views/backup.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/backup.html',
            },
          },
        })
        .state('recovery', {
          url: '/recovery',
          params: {
            backTo: 'security'
          },
          templateUrl: 'views/recovery.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/recovery.html',
            },
          },
        })
        .state('initialRecovery', {
          url: '/initialRecovery',
          templateUrl: 'views/recovery.html',
          walletShouldBeComplete: false,
          needProfile: false,
          views: {
            main: {
              templateUrl: 'views/recovery.html',
            },
          },
        })
        .state('preferencesGlobal', {
          url: '/preferencesGlobal',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/preferencesGlobal.html',
              controller: 'preferencesGlobalController as prefGlobal'
            },
          },
        })
        .state('transactions', {
          url: '/transactions',
          params: {
            backTo: 'walletHome',
            address: null
          },
          needProfile: true,
          views: {
            main: {
              templateUrl: 'controllers/transactions/transactions.template.html'
            },
          }
        })
        .state('transaction', {
          url: '/transactions/:address',
          params: {
            backTo: 'walletHome',
            address: null
          },
          needProfile: true,
          views: {
            main: {
              templateUrl: 'controllers/transactions/transactions.template.html'
            },
          }
        })
        .state('contacts', {
          url: '/contacts',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'controllers/contacts/contacts.template.html',
              controller: 'ContactsController as contacts'
            },
          }
        })
        .state('new_contact', {
          url: '/contacts/new',
          params: {
            backTo: 'contacts'
          },
          needProfile: true,
          views: {
            main: {
              templateUrl: 'controllers/contacts/contact/new_contact/new_contact.template.html',
              controller: 'NewContactController as contact'
            }
          }
        })
        .state('contact', {
          url: '/contacts/:address',
          params: {
            backTo: 'contacts'
          },
          needProfile: true,
          views: {
            main: {
              templateUrl: 'controllers/contacts/contact/contact.template.html',
              controller: 'ContactController as contact',
            }
          }
        })

        .state('edit_contact', {
          url: '/contact/:address/edit',
          params: {
            backTo: 'contact'
          },
          needProfile: true,
          views: {
            main: {
              templateUrl: 'controllers/contacts/contact/edit_contact/edit_contact.template.html',
              controller: 'EditContactController as contact'
            },
          }
        })
        .state('warning', {
          url: '/warning',
          controller: 'warningController',
          templateUrl: 'views/warning.html',
          needProfile: false,
        })

        .state('add', {
          url: '/add',
          needProfile: true,
          views: {
            main: {
              templateUrl: 'views/add.html',
            },
          },
        })
        .state('cordova', { // never used
          url: '/cordova/:status/:isHome',
          views: {
            main: {
              controller($rootScope, $state, $stateParams, $timeout, go, isCordova) {
                console.log(`cordova status: ${$stateParams.status}`);
                switch ($stateParams.status) {
                  case 'resume':
                    $rootScope.$emit('Local/Resume');
                    break;
                  case 'backbutton':
                    if (isCordova && $stateParams.isHome === 'true' && !$rootScope.modalOpened) {
                      navigator.app.exitApp();
                    } else {
                      $rootScope.$emit('closeModal');
                    }
                    break;
                  default:
                  // Error handler should be here
                }
                // why should we go home on resume or backbutton?
                /*
                 $timeout(function() {
                 $rootScope.$emit('Local/SetTab', 'walletHome', true);
                 }, 100);
                 go.walletHome();
                 */
              },
            },
          },
          needProfile: false,
        });
    })
    .run(($rootScope, $state, $stateParams, $log, uriHandler, isCordova, profileService, $timeout, nodeWebkit, uxLanguage, animationService, backButton, go) => {
      if ('addEventListener' in document) {
        document.addEventListener('DOMContentLoaded', () => {
          FastClick.attach(document.body);
        }, false);
      }

      uxLanguage.init();

      // Register URI handler, not for mobileApp
      if (!isCordova) {
        uriHandler.register();
      }

      if (nodeWebkit.isDefined()) {
        const gui = require('nw.gui');
        const win = gui.Window.get();
        win.setResizable(false);
        const os = require('os');
        const platform = os.platform();

        if (platform.indexOf('win') === -1) {
          const nativeMenuBar = new gui.Menu({
            type: 'menubar',
          });
          try {
            nativeMenuBar.createMacBuiltin('DAGCOIN');
          } catch (e) {
            $log.debug('This is not OSX');
          }
          win.menu = nativeMenuBar;
        }
      }

      $rootScope.$on('$stateChangeStart', (event, toState, toParams) => {
        backButton.menuOpened = false;
        go.swipe();
        if (!profileService.profile && toState.needProfile) {
          // Give us time to open / create the profile
          event.preventDefault();

          // Try to open local profile
          profileService.loadAndBindProfile((err) => {
            if (err) {
              if (err.message && err.message.match('NOPROFILE')) {
                $log.debug('No profile... redirecting');
                $state.go('splash');
              } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
                $log.debug('Display disclaimer... redirecting');
                $state.go('intro');
              } else {
                throw new Error(err); // TODO
              }
            } else {
              $log.debug('Profile loaded ... Starting UX.');
              $state.transitionTo(toState.name || toState, toParams);
            }
          });
        }

        if (
          profileService.focusedClient && !profileService.focusedClient.isComplete() &&
          toState.walletShouldBeComplete
        ) {
          $state.transitionTo('copayers');
          event.preventDefault();
        }
      });
    });
}());
