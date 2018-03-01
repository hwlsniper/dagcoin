/* eslint-disable no-underscore-dangle */

'use strict';

angular.module('copayApp.services').factory('fingerprintService', ($log, gettextCatalog, configService, isCordova,
                                                                   isMobile, $rootScope) => {
  const root = {};

  let _isAvailable = false;
  let isOpen = false;

  if (isCordova && !isMobile.Windows()) {
    window.plugins.touchid = window.plugins.touchid || {};
    window.plugins.touchid.isAvailable(
      () => {
        _isAvailable = 'IOS';
      },
      () => {
        FingerprintAuth.isAvailable((result) => {
          if (result.isAvailable) { _isAvailable = 'ANDROID'; }
        }, () => {
          _isAvailable = 'ANDROID';
        });
      });
  }

  const requestFinger = function (cb) {
    try {
      FingerprintAuth.encrypt({
        clientId: 'Dagcoin'
      },
        (result) => {
          if (result.withFingerprint) {
            $log.debug('Finger OK');
            isOpen = false;
            $rootScope.$emit('Local/FingerprintUnlocked', 'finger');
            return cb();
          } else if (result.withPassword) {
            $log.debug('Finger: Authenticated with backup password');
            isOpen = false;
            $rootScope.$emit('Local/FingerprintUnlocked', 'password');
            return cb();
          }
          $log.debug('Finger: Authenticated with other method (pattern etc.)');
          $rootScope.$emit('Local/FingerprintUnlocked', 'other');
          return cb();
        },
        (msg) => {
          $log.debug(`Finger Failed:${JSON.stringify(msg)}`);
          isOpen = false;
          return cb(gettextCatalog.getString('Finger Scan Failed'));
        }
      );
    } catch (e) {
      $log.warn(`Finger Scan Failed:${JSON.stringify(e)}`);
      isOpen = false;
      return cb(gettextCatalog.getString('Finger Scan Failed'));
    }
  };


  const requestTouchId = function (cb) {
    try {
      window.plugins.touchid.verifyFingerprint(
        gettextCatalog.getString('Scan your fingerprint please'),
        () => {
          $log.debug('Touch ID OK');
          isOpen = false;
          $rootScope.$emit('Local/FingerprintUnlocked', 'finger');
          return cb();
        },
        (msg) => {
          $log.debug(`Touch ID Failed:${JSON.stringify(msg)}`);
          isOpen = false;
          return cb(gettextCatalog.getString('Touch ID Failed'));
        }
      );
    } catch (e) {
      $log.debug(`Touch ID Failed:${JSON.stringify(e)}`);
      isOpen = false;
      return cb(gettextCatalog.getString('Touch ID Failed'));
    }
  };

  const isNeeded = (client) => {
    if (!_isAvailable || isOpen) return false;
    if (client === 'unlockingApp') return true;

    const config = configService.getSync();
    config.touchIdFor = config.touchIdFor || {};
    return config.touchIdFor[client.credentials.walletId];
  };

  root.isAvailable = () => _isAvailable;

  root.check = function (client, cb) {
    $log.debug('FingerPrint Service:', _isAvailable);
    if (isNeeded(client)) {
      isOpen = true;
      if (_isAvailable === 'IOS') { return requestTouchId(cb); }
      return requestFinger(cb);
    }
    return cb();
  };

  return root;
});
