(function () {
  'use strict';

  angular.module('copayApp.services').factory('configService', (storageService, lodash, $log, isCordova, ENV) => {
    const root = {};

    const defaultConfig = {
      // wallet limits
      limits: {
        totalCosigners: 6,
      },

      hub: ENV.hub,

      // requires bluetooth permission on android
      // deviceName: /*isCordova ? cordova.plugins.deviceName.name : */require('os').hostname(),

      getDeviceName() {
        return isCordova ? cordova.plugins.deviceName.name : require('os').hostname();
      },

      // wallet default config
      wallet: {
        requiredCosigners: 2,
        totalCosigners: 3,
        spendUnconfirmed: false,
        reconnectDelay: 5000,
        idleDurationMin: 4,
        settings: {
          unitName: 'bytes',
          unitValue: 1,
          unitDecimals: 0,
          unitCode: 'oneByte',
          dagUnitName: 'DAG',
          dagUnitValue: 1000000,
          dagUnitDecimals: 6,
          dagUnitCode: 'one',
          alternativeName: 'US Dollar',
          alternativeIsoCode: 'USD',
        },
      },

      rates: {
        url: 'https://insight.bitpay.com:443/api/rates',
      },

      pushNotifications: {
        enabled: true,
        config: {
          android: {
            icon: 'push',
            iconColor: '#2F4053',
          },
          ios: {
            alert: 'true',
            badge: 'true',
            sound: 'true',
          },
          windows: {},
        },
      },
      autoUpdateWitnessesList: true,
    };

    let configCache = null;

    root.getSync = function () {
      if (!configCache) {
        throw new Error('configService#getSync called when cache is not initialized');
      }
      return configCache;
    };

    root.get = function (cb) {
      storageService.getConfig((err, localConfig) => {
        if (localConfig) {
          configCache = JSON.parse(localConfig);

          // these ifs are to avoid migration problems
          if (!configCache.wallet) {
            configCache.wallet = defaultConfig.wallet;
          }
          if (!configCache.wallet.settings.unitCode) {
            configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
          }
          if (!configCache.wallet.settings.unitValue) {
            if (configCache.wallet.settings.unitToBytes) {
              configCache.wallet.settings.unitValue = configCache.wallet.settings.unitToBytes;
            } else {
              configCache.wallet.settings.unitValue = defaultConfig.wallet.settings.unitValue;
            }
          }
          if (!configCache.wallet.settings.dagUnitName) {
            configCache.wallet.settings.dagUnitName = defaultConfig.wallet.settings.dagUnitName;
          }
          if (!configCache.wallet.settings.dagUnitValue) {
            configCache.wallet.settings.dagUnitValue = defaultConfig.wallet.settings.dagUnitValue;
          }
          if (!configCache.wallet.settings.dagUnitDecimals) {
            configCache.wallet.settings.dagUnitDecimals = defaultConfig.wallet.settings.dagUnitDecimals;
          }
          if (!configCache.wallet.settings.dagUnitCode) {
            configCache.wallet.settings.dagUnitCode = defaultConfig.wallet.settings.dagUnitCode;
          }
          if (!configCache.pushNotifications) {
            configCache.pushNotifications = defaultConfig.pushNotifications;
          }
          if (!configCache.hub) {
            configCache.hub = defaultConfig.hub;
          }
          if (!configCache.deviceName) {
            configCache.deviceName = defaultConfig.getDeviceName();
          }
        } else {
          configCache = lodash.clone(defaultConfig);
          configCache.deviceName = defaultConfig.getDeviceName();
        }

        $log.debug('Preferences read:', configCache);
        return cb(err, configCache);
      });
    };

    root.set = function (newOpts, cb) {
      let config = defaultConfig;
      storageService.getConfig((err, oldOpts) => {
        let oldOptions;
        let newOptions = newOpts;
        if (lodash.isString(oldOpts)) {
          oldOptions = JSON.parse(oldOpts);
        }
        if (lodash.isString(config)) {
          config = JSON.parse(config);
        }
        if (lodash.isString(newOptions)) {
          newOptions = JSON.parse(newOptions);
        }
        lodash.merge(config, oldOptions, newOptions);
        configCache = config;

        storageService.storeConfig(JSON.stringify(config), cb);
      });
    };

    root.setWithoutMergingOld = function (newOpts, cb) {
      let config = defaultConfig;
      let newOptions = newOpts;

      if (lodash.isString(config)) {
        config = JSON.parse(config);
      }
      if (lodash.isString(newOptions)) {
        newOptions = JSON.parse(newOptions);
      }
      lodash.merge(config, newOptions);
      configCache = config;

      storageService.storeConfig(JSON.stringify(config), cb);
    };

    root.reset = function (cb) {
      configCache = lodash.clone(defaultConfig);
      storageService.removeConfig(cb);
    };

    root.getDefaults = function () {
      return lodash.clone(defaultConfig);
    };

    return root;
  });
}());
