(function () {
  'use strict';

  angular.module('dagcoin.controllers').controller('preferencesLogs',
    function (historicLog, gettextCatalog) {
      this.logs = historicLog.get();

      this.sendLogs = function () {
        let body = gettextCatalog.getString('Dagcoin Session Logs\n Be careful, this could contain sensitive private data\n\n');
        body += '\n\n';
        body += this.logs.map(v => v.msg).join('\n');

        window.plugins.socialsharing.shareViaEmail(
          body,
          gettextCatalog.getString('Dagcoin Logs'),
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          () => {},
          () => {}
        );
      };
    });
}());
