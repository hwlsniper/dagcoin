(function () {
  'use strict';

  /* eslint-disable no-shadow */
  /* global PushNotification */
  angular.module('copayApp.services')
  .factory('pushNotificationsService', ($http, $rootScope, $log, isMobile, storageService, configService, lodash, isCordova) => {
    const root = {};
    const usePushNotifications = isCordova && !isMobile.Windows();
    let projectNumber;
    let wsLocal;

    const eventBus = require('byteballcore/event_bus.js');
    const pushNotificationWrapper = new PushNotificationWrapper(usePushNotifications);

    function sendRequestEnableNotification(ws, registrationId) {
      const network = require('byteballcore/network.js');
      network.sendRequest(ws, 'hub/enable_notification', registrationId, false, (ws, request, response) => {
        if (!response || (response && response !== 'ok')) {
          return $log.error('Error sending push info');
        }
      });
    }

    /*
    window.onNotification = function (data) {
      if (data.event === 'registered') {
        return storageService.setPushInfo(projectNumber, data.regid, true, () => {
          sendRequestEnableNotification(wsLocal, data.regid);
        });
      }
      return false;
    };
    */

    eventBus.on('receivedPushProjectNumber', (ws, data) => {
      wsLocal = ws;
      if (data && data.projectNumber !== undefined) {
        storageService.getPushInfo((err, pushInfo) => {
          projectNumber = `${data.projectNumber}`;
          if (pushInfo && projectNumber === '0') {
            root.pushNotificationsUnregister(() => {

            });
          }
        });
      }
    });

    pushNotificationWrapper.init();

    /*
    root.pushNotificationsInit = function () {
      if (!usePushNotifications) return;

      window.plugins.pushNotification.register(() => {},
        (e) => {
          alert(`err= ${e}`);
        }, {
          senderID: projectNumber,
          ecb: 'onNotification',
        });
    };
    */

    function disableNotification() {
      storageService.getPushInfo((err, pushInfo) => {
        storageService.removePushInfo(() => {
          const network = require('byteballcore/network.js');
          network.sendRequest(wsLocal, 'hub/disable_notification', pushInfo.registrationId, false, (ws, request, response) => {
            if (!response || (response && response !== 'ok')) {
              return $log.error('Error sending push info');
            }
          });
        });
      });
      /*
      configService.set({ pushNotifications: { enabled: false } }, (err) => {
        if (err) $log.debug(err);
      });
      */
    }

    root.pushNotificationsUnregister = function () {
      return pushNotificationWrapper.unregister();
      /*
      if (!usePushNotifications) return;
      window.plugins.pushNotification.unregister(() => {
        disableNotification();
      }, () => {
        disableNotification();
      });
      */
    };

    root.pushNotificationsRegister = function () {
      return pushNotificationWrapper.register();
    };

      /**
       *
       * @param pushIsAvailableOnSystem if false push notifications calls like as mock, do nothing
       * @constructor
       */
      function PushNotificationWrapper(pushIsAvailableOnSystem) {
        this.pushIsAvailableOnSystem = pushIsAvailableOnSystem;
        this.push = null;

        this.available = false;
        this.init = () => {
          if (this.pushIsAvailableOnSystem && typeof PushNotification !== 'undefined') {
            this.push = PushNotification.init({
              android: {
              },
              browser: {
                pushServiceURL: 'http://push.api.phonegap.com/v1/push'
              },
              ios: {
                alert: 'true',
                badge: 'true',
                sound: 'true'
              },
              windows: {}
            });
          }
          this.available = this.push && this.pushIsAvailableOnSystem;
        };

        this.register = () => {
          console.log('registering push notification');
          return new Promise((resolve, reject) => {
            if (!this.available) {
              reject();
              return;
            }

            // The event registration will be triggered on each successful registration with the 3rd party push service.
            this.push.on('registration', (data) => {
              // data.registrationId
              console.log(`Push Notification RegId: ${data.registrationId}`);
              alert(`Push Notification RegId: ${data.registrationId}`);
              storageService.setPushInfo(projectNumber, data.registrationId, true, () => {
                sendRequestEnableNotification(wsLocal, data.registrationId);
              });
              resolve(data);
            });

            // The event notification will be triggered each time a push notification is received by a 3rd party push service on the device.
            this.push.on('notification', (data) => {
              // message, title, count, sound, image, additionalData
              alert(`Push Notification Received: ${data}${data.message}`);
            });

            // The event error will trigger when an internal error occurs and the cache is aborted.
            this.push.on('error', (e) => {
              // e.message
              alert(`error: ${e.message}`);
            });
          });
        };

        this.unregister = () => {
          console.log('unregistering push notification');
          return new Promise((resolve, reject) => {
            if (!this.available) {
              reject();
              return;
            }
            this.push.unregister(() => {
              console.log('push unregistering called');
              return Promise.resolve(disableNotification());
            }, () => {
              reject();
            });
          });
        };
      }
      return root;
    });
}());
