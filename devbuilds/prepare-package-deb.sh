#!/usr/bin/env bash

Green='\033[0;32m'
Red='\033[0;31m'
CloseColor='\033[0m'

# package version can be passed as 2nd parameter, if not exists as parameter it is read from package.json file.
PACKAGE_VERSION="$2"
if [ -z "${PACKAGE_VERSION}" ]; then
  PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
fi

echo -e "${Green}* Package Version:${PACKAGE_VERSION}${CloseColor}"

echo -e "${Green}* Preparing folders for Debian Linux distributions...${CloseColor}"

if [ "$1" == "testnet" ]; then
  Type="-tn"
  ExecPost="-TN"
  ZipFilePath='../byteballbuilds/Dagcoin-TN-linux64.zip'
  Action=linux64:testnet
else
  Type=""
  ExecPost=""
  ZipFilePath='../byteballbuilds/Dagcoin-linux64.zip'
  Action=linux64:live
fi

DEBIAN_FOLDER="../byteballbuilds/dagcoin${Type}-${PACKAGE_VERSION}"

# prepare the folder for debian package
rm -rf ${DEBIAN_FOLDER}
mkdir -p ${DEBIAN_FOLDER}/debian
mkdir -p ${DEBIAN_FOLDER}/tree/usr/share
cp ./devbuilds/linux/debian-64/* ${DEBIAN_FOLDER}/debian

# replace @version text with version of package
VERSION_EXP='s/@version/'${PACKAGE_VERSION}'/g'
sed -i ${VERSION_EXP} ${DEBIAN_FOLDER}/debian/changelog
sed -i ${VERSION_EXP} ${DEBIAN_FOLDER}/debian/control
sed -i ${VERSION_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.desktop


#replace all files according to the @type
TYPE_EXP='s/@type/'${Type}'/g'
sed -i ${TYPE_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.links
sed -i ${TYPE_EXP} ${DEBIAN_FOLDER}/debian/changelog
sed -i ${TYPE_EXP} ${DEBIAN_FOLDER}/debian/control
sed -i ${TYPE_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.postinst
sed -i ${TYPE_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.postrm
sed -i ${TYPE_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.desktop

EXEC_POST_EXP='s/@exec-post/'${ExecPost}'/g'
sed -i ${EXEC_POST_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.links
sed -i ${EXEC_POST_EXP} ${DEBIAN_FOLDER}/debian/changelog
sed -i ${EXEC_POST_EXP} ${DEBIAN_FOLDER}/debian/control
sed -i ${EXEC_POST_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.postinst
sed -i ${EXEC_POST_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.postrm
sed -i ${EXEC_POST_EXP} ${DEBIAN_FOLDER}/debian/dagcoin.desktop

# IF type is -tn then rename all files begin with dagcoin in debian folder
if [ ${Type} == "-tn" ]; then
  mv ${DEBIAN_FOLDER}/debian/dagcoin.install ${DEBIAN_FOLDER}/debian/dagcoin-tn.install
  mv ${DEBIAN_FOLDER}/debian/dagcoin.desktop ${DEBIAN_FOLDER}/debian/dagcoin-tn.desktop
  mv ${DEBIAN_FOLDER}/debian/dagcoin.links ${DEBIAN_FOLDER}/debian/dagcoin-tn.links
  mv ${DEBIAN_FOLDER}/debian/dagcoin.postinst ${DEBIAN_FOLDER}/debian/dagcoin-tn.postinst
  mv ${DEBIAN_FOLDER}/debian/dagcoin.postrm ${DEBIAN_FOLDER}/debian/dagcoin-tn.postrm
  echo -e "${Green}OK renamed with -tn all files whose names begin with dagcoin in debian folder ${CloseColor}"
fi

echo -e "${Green}OK ${DEBIAN_FOLDER}/debian folder created${CloseColor}"
echo -e "${Green}OK ${DEBIAN_FOLDER}/tree folder created${CloseColor}"
echo -e "${Green}OK @type, @package-name and @version replacements done in changelog, control, .postinst and .postrm and dagcoin.links files${CloseColor}"

echo -e "${Green}* Checking if zip file exists${CloseColor}"

if [ -f "${ZipFilePath}" ]
then
	echo -e "${Green}OK ${ZipFilePath} found.${CloseColor}"
else
	echo -e "${Red}ERROR ${ZipFilePath} not found. Exiting the script.${CloseColor}"
	exit 1
fi

# unzip the Dagcoin-(TN)-linux64.zip file into tree/.. folder
unzip ${ZipFilePath} -d ${DEBIAN_FOLDER}/tree/usr/share/Dagcoin${Type} > /dev/null

# after unzip, replace dagcoin.desktop
cp ${DEBIAN_FOLDER}/debian/dagcoin${Type}.desktop ${DEBIAN_FOLDER}/tree/usr/share/Dagcoin${Type}/
echo -e "${Green}OK copied dagcoin${Type}.desktop file into tree/usr/share/Dagcoin${Type}/ ${CloseColor}"

echo -e "${Green}OK ${ZipFilePath} extracted into tree/usr/share/Dagcoin${CloseColor}"

# go to the folder for debian package and run debuild
cd ${DEBIAN_FOLDER}
echo -e "${Green}* Starting debuild ${CloseColor}"
debuild --no-lintian -uc -us

# check if deb file created
DebPackageFilePath="../dagcoin${Type}_${PACKAGE_VERSION}_all.deb" #amd64 comes from control file
if [ -f "${DebPackageFilePath}" ]
then
	echo -e "${Green}\e[1mOK ${DebPackageFilePath} created.${CloseColor}"
else
	echo -e "${Red}ERROR ${DebPackageFilePath} not found.${CloseColor}"
fi
