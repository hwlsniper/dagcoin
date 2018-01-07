(() => {
  'use strict';

  /**
   * @desc Transactions table
   * @example <dag-transactions-table></dag-transactions-table>
   */
  angular
    .module('copayApp.directives')
    .directive('dagTransactionsTable', dagTransactionsTable);

  dagTransactionsTable.$inject = ['moment', 'exportTransactions', 'isCordova', '$timeout', '$rootScope', 'gettextCatalog', '$q', 'profileService'];

  function dagTransactionsTable(moment, exportTransactions, isCordova, $timeout, $rootScope, gettextCatalog, $q, profileService) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'directives/dagTransactionsTable/dagTransactionsTable.template.html',
      scope: {
        rows: '='
      },
      link: ($scope) => {
        const today = moment().format('DD/MM/YYYY');
        const yesterday = moment().subtract(1, 'day').format('DD/MM/YYYY');
        const fc = profileService.focusedClient;
        $scope.walletId = fc.credentials.walletId;
        $scope.loading = true;
        $scope.isCordova = isCordova;
        $scope.transactions = {};
        $scope.visible_rows = 0;
        $scope.limit = 10;

        $scope.exportToCsv = () => {
          if (!$scope.exporting) {
            $scope.exporting = true;
            exportTransactions.toCSV().then(() => {
              $timeout(() => {
                $scope.exporting = false;
              }, 500);
            });
          }
        };

        $scope.openTransaction = (transaction) => {
          $rootScope.openTxModal(transaction, $scope.rows);
        };

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

        $scope.formatDate = (value) => {
          if (value === today) {
            return 'Today';
          } else if (value === yesterday) {
            return 'Yesterday';
          }
          return value;
        };

        $scope.transactionStatus = (transaction) => {
          if (!transaction.confirmations) {
            return { icon: 'autorenew', title: gettextCatalog.getString('Pending') };
          }

          if (transaction.action === 'received') {
            return { icon: 'call_received', title: gettextCatalog.getString('Received') };
          }
          return { icon: 'call_made', title: gettextCatalog.getString('Sent') };
        };

        function filterRows() {
          $scope.transactions = {};

          return $q((resolve) => {
            for (let x = 0, maxLen = $scope.rows.length; x < maxLen; x += 1) {
              if (x <= $scope.limit) {
                const t = $scope.rows[x];
                console.log(t);
                if (!t.isFundingNodeTransaction) {
                  const timestamp = t.time * 1000;
                  const date = moment(timestamp).format('DD/MM/YYYY');

                  if (!$scope.transactions[date]) {
                    $scope.transactions[date] = [];
                  }

                  $scope.transactions[date].push(t);
                  $scope.visible_rows += 1;
                }
              }
            }
            resolve(true);
          });
        }

        $scope.$watch('rows', () => {
          if ($scope.rows.length > 0) {
            filterRows().then(() => {
              $scope.loading = false;
            });
          } else {
            $scope.loading = false;
          }
        });

        $scope.increaseLimit = () => {
          $scope.limit += 10;
          filterRows();
        };

        $rootScope.$on('Local/UpdateHistoryStart', () => {
          $scope.loading = true;
        });
      }
    };
  }
})();
