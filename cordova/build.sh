#! /bin/bash
#
# Usage:
# sh ./build.sh --android --reload
#
#
Green='\033[0;32m'
Red='\033[0;31m'
CloseColor='\033[0m'
# Check function OK
checkOK() {
	if [ $? != 0 ]; then
		echo "${OpenColor}${Red}* ERROR. Exiting...${CloseColor}"
		exit 1
	fi
}

# Check cordova vesion, in order to run push notification on android, cordova version must be 7.1.0
checkCordovaVersion() {
  if [ $CURRENT_OS == "ANDROID" ]; then
    CordovaVersion=$(cordova -v)
    if [ $CordovaVersion != "7.1.0" ]; then
      echo -e "${Red}ERROR Cordova version must be 7.1.0 ${CloseColor}"
      exit 1
    fi
  fi
  echo -e "${Green}OK Cordova Version: ${CordovaVersion}${CloseColor}"
}

# Configs
BUILDDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT="$BUILDDIR/../../byteballbuilds/project-$1"

CURRENT_OS=$1

checkCordovaVersion

if [ -z "CURRENT_OS" ]
then
 echo "Build.sh WP8|ANDROID|IOS"
fi

CLEAR=false
DBGJS=false

if [[ $2 == "--clear" || $3 == "--clear" ]]
then
	CLEAR=true
fi

if [[ $2 == "--dbgjs" || $3 == "--dbgjs" ]]
then
	DBGJS=true
fi


echo "${OpenColor}${Green}* Checking dependencies...${CloseColor}"
command -v cordova >/dev/null 2>&1 || { echo >&2 "Cordova is not present, please install it: sudo npm install -g cordova."; exit 1; }
#command -v xcodebuild >/dev/null 2>&1 || { echo >&2 "XCode is not present, install it or use [--android]."; exit 1; }

# Create project dir
if $CLEAR
then
	if [ -d $PROJECT ]; then
		rm -rf $PROJECT
	fi
fi

echo "Build directory is $BUILDDIR"
echo "Project directory is $PROJECT"


if [ ! -d $PROJECT ]; then
	cd $BUILDDIR
	echo "${OpenColor}${Green}* Creating project... ${CloseColor}"
	cordova create ../../byteballbuilds/project-$1 org.dagcoin Dagcoin
	checkOK

	cd $PROJECT

	if [ $CURRENT_OS == "ANDROID" ]; then
		echo -e "${OpenColor}${Green}* Adding Android platform... ${CloseColor}"
		cordova platforms add android
		checkOK
	fi

	if [ $CURRENT_OS == "IOS" ]; then
		echo "${OpenColor}${Green}* Adding IOS platform... ${CloseColor}"
		cordova platforms add ios
		checkOK
	fi

	if [ $CURRENT_OS == "WP8" ]; then
		echo "${OpenColor}${Green}* Adding WP8 platform... ${CloseColor}"
		cordova platforms add wp8
		checkOK
	fi

	echo "${OpenColor}${Green}* Installing plugins... ${CloseColor}"

#  cordova plugin add https://github.com/florentvaldelievre/virtualartifacts-webIntent.git
#  checkOK

	if [ $CURRENT_OS == "IOS" ]; then
		cordova plugin add https://github.com/phonegap/phonegap-plugin-barcodescanner.git
	else
	  #commented because android-23 to 26
		#cordova plugin add cordova-plugin-android-support-v4-jar
		#checkOK
		#cordova plugin add https://github.com/jrontend/phonegap-plugin-barcodescanner.git
		cordova plugin add https://github.com/phonegap/phonegap-plugin-barcodescanner.git
		checkOK
		# cordova plugin add phonegap-plugin-barcodescanner@5.0.0
		#cordova plugin add cordova-plugin-barcodescanner
		#cordova plugin add cordova-plugin-qrscanner

	fi
	checkOK

	cordova plugin add cordova-plugin-splashscreen
	checkOK

	cordova plugin add cordova-plugin-statusbar
	checkOK

	cordova plugin add cordova-plugin-customurlscheme --variable URL_SCHEME=$2
	checkOK

	cordova plugin add cordova-plugin-inappbrowser
	checkOK

	cordova plugin add cordova-plugin-x-toast && cordova prepare
	checkOK

	phonegap local plugin add https://github.com/ibnclaudius/CordovaClipboard
	checkOK

	cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git && cordova prepare
	checkOK

	cordova plugin add cordova-plugin-spinner-dialog
	checkOK

	cordova plugin add cordova-plugin-dialogs
	checkOK

	cordova plugin add cordova-plugin-network-information
	checkOK

	cordova plugin add cordova-plugin-console
	checkOK

 	cordova plugin add cordova-plugin-uniquedeviceid
 	checkOK

	cordova plugin add cordova-plugin-file
	checkOK

	cordova plugin add cordova-plugin-touch-id && cordova prepare
	checkOK

	cordova plugin add cordova-plugin-android-fingerprint-auth
	checkOK

	cordova plugin add cordova-plugin-transport-security
	checkOK

	cordova plugin add cordova-ios-requires-fullscreen
	checkOK

	cordova plugin add cordova-sqlite-plugin
	checkOK

	cordova plugin add cordova-plugin-device-name
	checkOK

	if [ $CURRENT_OS == "ANDROID" ]; then
	  cordova plugin add phonegap-plugin-push@2.1.3
	  checkOK
	fi

	#phonegap local plugin add https://github.com/phonegap-build/PushPlugin.git
	#checkOK

	cordova plugin add https://github.com/xJeneKx/MFileChooser.git
	checkOK

fi

if $DBGJS
then
	echo "${OpenColor}${Green}* Generating byteball bundle (debug js)...${CloseColor}"
	cd $BUILDDIR/..
	grunt cordova:$4
	checkOK
else
	echo "${OpenColor}${Green}* Generating byteball bundle...${CloseColor}"
	cd $BUILDDIR/..
	#grunt cordova-prod byteball core has some error, so uglify doesn't work.
	grunt cordova:$4
	checkOK
fi

echo "${OpenColor}${Green}* Copying files...${CloseColor}"
cd $BUILDDIR/..
cp -af public/** $PROJECT/www
checkOK

echo "${OpenColor}${Green}* Copying initial database...${CloseColor}"
cp node_modules/byteballcore/initial.byteball.sqlite $PROJECT/www
cp node_modules/byteballcore/initial.byteball-light.sqlite $PROJECT/www
checkOK

sed "s/<\!-- PLACEHOLDER: CORDOVA SRIPT -->/<script type='text\/javascript' charset='utf-8' src='cordova.js'><\/script>/g" public/index.html > $PROJECT/www/index.html
checkOK

cd $BUILDDIR

cp config.xml $PROJECT/config.xml
checkOK

if [ $CURRENT_OS == "ANDROID" ]; then
	echo "Android project!!!"

	cat $BUILDDIR/android/android.css >> $PROJECT/www/css/dagcoin.css

	mkdir -p $PROJECT/platforms/android/res/xml/
	checkOK

  # gcm needs google-services.json. google-services.json is downloaded from firebase web site.
	cp android/google-services.json $PROJECT/platforms/android/google-services.json
	checkOK

  # new cordova-android needs colors.xml
	cp android/colors.xml $PROJECT/platforms/android/res/values
	checkOK


#  cp android/AndroidManifest.xml $PROJECT/platforms/android/AndroidManifest.xml
#  checkOK

	cp android/build-extras.gradle $PROJECT/platforms/android/build-extras.gradle
	checkOK

	cp android/project.properties $PROJECT/platforms/android/project.properties
	checkOK

	cp -R android/res/* $PROJECT/platforms/android/res
	checkOK
fi

if [ $CURRENT_OS == "IOS" ]; then

	echo "IOS project!!!"

	cp -R ios $PROJECT/../
	checkOK
#  mkdir -p $PROJECT/platforms/ios
#  checkOK
#
#  cp ios/Byteball-Info.plist $PROJECT/platforms/ios/Byteball-Info.plist
#  checkOK
#
#  mkdir -p $PROJECT/platforms/ios/Byteball/Resources/icons
#  checkOK
#
#  mkdir -p $PROJECT/platforms/ios/Byteball/Resources/splash
#  checkOK
#
#  cp -R ios/icons/* $PROJECT/platforms/ios/Byteball/Resources/icons
#  checkOK
#
#  cp -R ios/splash/* $PROJECT/platforms/ios/Byteball/Resources/splash
#  checkOK
fi

if [ $CURRENT_OS == "WP8" ]; then
	echo "Wp8 project!!!"
	cp -R $PROJECT/www/* $PROJECT/platforms/wp8/www
	checkOK
	if ! $CLEAR
	then
		cp -vf wp/Properties/* $PROJECT/platforms/wp8/Properties/
		checkOK
		cp -vf wp/MainPage.xaml $PROJECT/platforms/wp8/
		checkOK
		cp -vf wp/Package.appxmanifest $PROJECT/platforms/wp8/
		checkOK
		cp -vf wp/Assets/* $PROJECT/platforms/wp8/Assets/
		cp -vf wp/SplashScreenImage.jpg $PROJECT/platforms/wp8/
		cp -vf wp/ApplicationIcon.png $PROJECT/platforms/wp8/
		cp -vf wp/Background.png $PROJECT/platforms/wp8/
		checkOK
	fi
fi
