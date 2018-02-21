To create debian package you need to install some packages
1. `sudo apt install debhelper`
2. `sudo apt install devscripts`
3. `sudo apt install dh-make` (optional)

**prepare-package-deb** or **prepare-package-deb-tn** must be run. These are defined in Makefile. `make prepare-package-deb(-tn)`


**Note**: Before running one of these jobs you have to create Dagcoin-(TN)-linux64.zip file. To create zip file you need to run following commands in order.

1. `make prepare-dev(-tn)`
2. `make prepare-package(-tn)`
3. `make prepare-package-deb(-tn)`

After success a debian package (.deb) file is created in byteballbuilds folder. The patter of file name
is dagcoin-version-amd64.deb.

The version is read from field name "version" in package.json unless it is send via command parameter.
This version is replaced in files `changelog`, `control` and `dagcoin.desktop` files with `@version` key.
The dagcoin link is created in /usr/bin directory. The type is replaced in file dagcoin.links with
`@type` key. This is empty string for live or '-TN' for testnet.

Please look at prepare-package-deb.sh file for `sed` commands.

It is available for test and live environments.

