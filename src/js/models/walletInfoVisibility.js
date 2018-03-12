/* eslint-disable no-unused-vars */
/**
 * walletInfoVisibility used for controlling initial display of wallet information in case of enabled password protection
 * and or finger print protection
 *
 * This class is used in walletHome.html
 *
 * @param needPassword true if password protection is enabled
 * @param needFingerPrint true if finger print protection is enabled
 */
function WalletInfoVisibility(needPassword, needFingerPrint) {
  this.needPassword = needPassword;
  this.needFingerprint = needFingerPrint;

  // if there is no need password, passwordOk is set to true not to effect displaying wallet information
  this.passwordOk = !this.needPassword;

  // if there is no finger print setting, fingerprintOk is set to true not to effect displaying wallet information
  this.fingerprintOk = !this.needFingerprint;

  const self = this;
  const init = () => {
    self.visible = self.passwordOk && self.fingerprintOk;
  };

  init();
  /**
   * @param value boolean
   */
  this.setPasswordSuccess = (value) => {
    this.passwordOk = value;
    init();
  };

  /**
   *
   * @param value boolean
   */
  this.setFingerprintSuccess = (value) => {
    this.fingerprintOk = value;
    init();
  };
}
