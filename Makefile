VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`
GREEN=\033[0;32m
CLOSECOLOR=\033[0m

UNAME := $(shell uname)

ifeq ($(UNAME), Linux)
  SHELLCMD := bash
endif

ifeq ($(UNAME), Darwin)
  SHELLCMD := sh
endif

prepare-dev:
	$(SHELLCMD) devbuilds/prepare-dev.sh live

prepare-dev-tn:
	$(SHELLCMD) devbuilds/prepare-dev.sh testnet
	@echo "$(GREEN)Generating testnet configuration...$(CLOSECOLOR)"
	$(SHELLCMD) devbuilds/testnetify.sh
	@echo "$(GREEN)Done. You can start wallet now. $(CLOSECOLOR)"

prepare-package:
	$(SHELLCMD) devbuilds/prepare-package.sh live

prepare-package-tn:
	$(SHELLCMD) devbuilds/prepare-package.sh testnet

ios-prod:
	cordova/build.sh IOS --clear
	cd ../byteballbuilds/project-IOS-tn && cordova build ios
#	open ../byteballbuilds/project-IOS-tn/platforms/ios/Byteball.xcodeproj

ios-debug:
	cordova/build.sh IOS --dbgjs
	cd ../byteballbuilds/project-IOS  && cordova build ios
	open ../byteballbuilds/project-IOS /platforms/ios/Byteball.xcodeproj

android-prod:
	cordova/build.sh ANDROID dagcoin --clear live
	cd ../byteballbuilds/project-ANDROID  && cordova build --release android
#   keytool -genkey -v -keystore <keystore_name>.keystore -alias <keystore alias> -keyalg RSA -keysize 2048 -validity 10000
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore dagcoin.jks -tsa http://sha256timestamp.ws.symantec.com/sha256/timestamp -signedjar ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-signed.apk  ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-unsigned.apk dagcoin
	$(ANDROID_HOME)/build-tools/25.0.3/zipalign -v 4 ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-signed.apk ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-signed-aligned.apk

android-prod-tn:
	cordova/build.sh ANDROID dagcoin --clear testnet
	cd ../byteballbuilds/project-ANDROID  && cordova build --release android
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore dagcoin.jks -tsa http://sha256timestamp.ws.symantec.com/sha256/timestamp -signedjar ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-signed.apk  ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-unsigned.apk dagcoin
	$(ANDROID_HOME)/build-tools/25.0.3/zipalign -v 4 ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-signed.apk ../byteballbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-signed-aligned.apk

android-debug-fast:
	cordova/build.sh ANDROID dagcoin --dbgjs live
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../byteballbuilds/project-ANDROID && cordova run android --device
#	cd ../byteballbuilds/project-ANDROID && cordova build android

android-debug-fast-tn:
	cordova/build.sh ANDROID dagcoin --dbgjs testnet
	cd ../byteballbuilds/project-ANDROID && cordova run android --device
#	cd ../byteballbuilds/project-ANDROID && cordova build android

android-debug-fast-emulator-tn:
	cordova/build.sh ANDROID dagcoin --dbgjs testnet
	cd ../byteballbuilds/project-ANDROID && cordova emulate android
