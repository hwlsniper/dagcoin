(function () {
  'use strict';

  /* eslint-disable no-shadow */
  /* global PushNotification */
  angular.module('copayApp.services')
  .factory('pushNotificationsService', ($http, $rootScope, $log, isMobile, storageService, lodash, isCordova,
                                        configService, $timeout, $state) => {
    const root = {};
    const usePushNotifications = isCordova && !isMobile.Windows();
    const constants = require('byteballcore/constants.js');
    const isProduction = !constants.version.match(/t$/);

    // For now if system is in product push notifications disabled.
    // After product hub is established remove !isProduction control.
    root.pushIsAvailableOnSystem = usePushNotifications && !isProduction;
    let projectNumber;
    let wsLocal;

    const eventBus = require('byteballcore/event_bus.js');
    const pushNotificationWrapper = new PushNotificationWrapper(usePushNotifications);

    eventBus.on('receivedPushProjectNumber', (ws, data) => {
      console.log(`receivedPushProjectNumber: ${data.projectNumber}`);
      wsLocal = ws;
      if (data && data.projectNumber !== undefined) {
        storageService.getPushInfo((err, pushInfo) => {
          projectNumber = `${data.projectNumber}`;
          if (pushInfo && projectNumber === '0') {
            root.pushNotificationsUnregister(() => { });
          } else {
            const config = configService.getSync();
            if (config.pushNotifications.enabledNew) {
              pushNotificationWrapper.init();
            }
          }
        });
      }
    });

    root.pushNotificationsUnregister = function (cb) {
      pushNotificationWrapper.unregister(cb);
    };

    root.pushNotificationsRegister = function (cb) {
      pushNotificationWrapper.init(cb);
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

      /**
       * A push notification coming from hub when application starts. It means that a device emits "peer_sent_new_message"
       * This property prevents move chat tab at first push notification.
       */
      this.first = true;

      /**
       * If push is disabled by user, this method has no effect.
       * In order to available push notifications available pushIsAvailableOnSystem and PushNotification plugin must
       * exists in application.
       * @param cb Callback function gets registrationId as parameter
       */
      this.init = (cb) => {
        this.available = this.pushIsAvailableOnSystem && typeof PushNotification !== 'undefined';
        if (this.available) {
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
          console.log('registering push notification');
          this.push.on('registration', (data) => {
            // data members: registrationId
            console.log(`Push Notification RegId: ${data.registrationId}`);
            storageService.getPushInfo((err, pushInfo) => {
              if (!pushInfo) {
                storageService.setPushInfo(projectNumber, data.registrationId, true, () => {
                  if (lodash.isEmpty(wsLocal) && cb) {
                    cb(null, 'ws can not be retrieved yet');
                    return;
                  }
                  sendRequestEnableNotification(wsLocal, data.registrationId, cb);
                });
              }
            });
          });
          this.push.on('notification', (data) => {
            // data members: message, title, count, sound, image, additionalData
            console.log(`Push Notification Received: ${data.message}`);
            // If notification type is "msg" open chat tab. type property is coming from hub.
            if (!this.first && data.additionalData['type'] === 'msg') {
              $state.go('correspondentDevices');
              $timeout(() => { $rootScope.$apply(); });
            }
            this.first = false;
          });
          this.push.on('error', (e) => {
            // e members: message
            console.log(`Push Notification Error: ${e.message}`);
          });
        } else {
          console.log('Push notifications are not available on system');
        }
      };

      /**
       * If the device is not available for push notification, nothing happens
       * @param cb Callback function gets registrationId as first parameter, second is err [string]
       */
      this.unregister = (cb) => {
        if (!this.available) {
          cb(null, 'not available');
          return;
        }
        console.log('unregistering push notification');
        disableNotification(cb);
      };
    }

    /**
     *
     * @param ws
     * @param registrationId
     * @param cb Callback function gets registrationId as first parameter, second is err [string]
     */
    function sendRequestEnableNotification(ws, registrationId, cb) {
      const cbForSendRequest = lodash.isFunction(cb) ? cb : () => { };
      const network = require('byteballcore/network.js');
      network.sendRequest(ws, 'hub/enable_notification', registrationId, false, (ws, request, response) => {
        if (!response || (response && response !== 'ok')) {
          cbForSendRequest(null, 'Error sending push info');
          return $log.error('Error sending push info');
        }
        cbForSendRequest(registrationId);
      });
    }

    /**
     *
     * @param cb Callback function gets registrationId as first parameter, second is err [string]
     */
    function disableNotification(cb) {
      const cbForSendRequest = lodash.isFunction(cb) ? cb : () => { };
      if (lodash.isEmpty(wsLocal)) {
        cbForSendRequest(null, 'ws can not be retrieved yet');
        return;
      }
      storageService.getPushInfo((err, pushInfo) => {
        if (!pushInfo || !pushInfo.registrationId) {
          const err = 'pushInfo unregister problem :: pushInfo or pushInfo.registrationId is undefined or null. Please try later.';
          cbForSendRequest(null, err);
          console.error(err);
          return;
        }
        storageService.removePushInfo(() => {
          const network = require('byteballcore/network.js');
          network.sendRequest(wsLocal, 'hub/disable_notification', pushInfo.registrationId, false, (ws, request, response) => {
            if (!response || (response && response !== 'ok')) {
              cbForSendRequest(null, 'Error sending push info');
              return $log.error('Error sending push info');
            }
            cbForSendRequest(pushInfo.registrationId);
          });
        });
      });
    }

    return root;
  });
}());
