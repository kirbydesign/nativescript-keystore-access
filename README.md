# Nativescript Keystore Access

> Also works with Face ID on iPhone X
> Requires Xcode 9+, iOS 11 SDK

<img src="https://raw.githubusercontent.com/kirbydesign/nativescript-keystore-access/master/media/fingerprint-icon.png" />
<div>Icon made by <a href="https://www.flaticon.com/authors/surang" title="surang">surang</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-keystore-access
```

## WARNING
**You must always make sure you call `cleanup()` when you leave/finish the context where you are using the plugin.** This is because of the way the Android FingerprintManager works. If you have the Android FingerprintManager listening for fingerprint and you leave the context or even closes the app or crash the app, you may have a defunct FingerprintManager still listening for fingerprint, and then if you start the app again or any other app that uses fingerprint, this will fail because of the still listening defunct FingerprintManager. It is therefore important to hook into `ngOnDestroy()` on any component using this plugin an call `cleanup()` here.

## API

### `available`

Call this method to check if biometrics is available on your device. **Always call this method and check the result before calling any other method.**

#### TypeScript

```typescript
import { KeystoreAccess, BiometricIDAvailableResult } from "nativescript-keystore-access";

class MyClass {
  private keystoreAccess: KeystoreAccess;

  constructor() {
    this.keystoreAccess = new KeystoreAccess();
  }

  this.keystoreAccess.available().then((result: BiometricIDAvailableResult) => {
    console.log(`Biometric ID available? ${result.any}`);
    console.log(`Touch? ${result.touch}`);
    console.log(`Face? ${result.face}`);
    if (result.customUI) {
        // You must show a custom biometrics UI, basicly this means you are on Android and the OS does not show a UI for you.
        // You can at any time call `useCustomUI` to check if you should show a custom biometrics UI.
    }
  }).catch(err => {
    console.log("doCheckAvailable error: " + err.code + ", " + err.message);
  });
}
```

### `useCustomUI`

Call this method to check if you must show a custom biometrics UI to inform the user that the device is witing for a fingerprint.

#### TypeScript

```typescript
import { KeystoreAccess } from "nativescript-keystore-access";

class MyClass {
  private keystoreAccess: KeystoreAccess;

  constructor() {
    this.keystoreAccess = new KeystoreAccess();
  }

  if (this.keystoreAccess.useCustomUI()) {
    // You must show a custom biometrics UI, basicly this means you are on Android and the OS does not show a UI for you.
    // You can at any time call `useCustomUI` to check if you should show a custom biometrics UI.
  }
}
```

### `storeDataWithFingerprint`

Call this method to have some `string` data encrypted with the device keystore in a way so that it can only be decrypted with biometrics authentication.

#### TypeScript

```typescript
import { KeystoreAccess } from "nativescript-keystore-access";

class MyClass {
  private keystoreAccess: KeystoreAccess;

  constructor() {
    this.keystoreAccess = new KeystoreAccess();
  }

  // Remember to call "useCustomUI()" and show some UI that is indicating to the user that the device is awaiting a fingerprint.
  this.keystoreAccess.storeDataWithFingerprint(
      keystoreKeyAlias: "ALIAS", // A unique id for your data, use the same key for encryption and decryption of the same data, and another key for different data.
      data: "This is a secret", // The string you want to encrypt and store.
      biometricMessage: "Biometric Message" // A short description that will show up on the iOS biometrics dialog.
    ).then((result: void) => {
    console.log("Your secret is safe with me");
    // You can now remove your custom biometrics UI
  }).catch(err => {
    console.log("storeDataWithFingerprint error: " + err.code + ", " + err.message);
    // Inform the user of the error, that may or may not be recoverable, on your custom biometrics UI
  });
}
```

### `retrieveDataWithFingerprint`

Call this method to retrieve previously encrypted and stored data as a decrypted `string`.

#### TypeScript

```typescript
import { KeystoreAccess } from "nativescript-keystore-access";

class MyClass {
  private keystoreAccess: KeystoreAccess;

  constructor() {
    this.keystoreAccess = new KeystoreAccess();
  }

  // Remember to call "useCustomUI()" and show some UI that is indicating to the user that the device is awaiting a fingerprint.
  this.keystoreAccess.retrieveDataWithFingerprint(
      keystoreKeyAlias: "ALIAS", // A unique id for your data, use the same key for encryption and decryption of the same data, and another key for different data.
      biometricPromptMessage: "Biometric Prompt Message" // A short description that will show up on the iOS biometrics dialog.
    ).then((result: string) => {
    console.log("I just unlocked your secret: " + result);
    // You can now remove your custom biometrics UI
  }).catch(err => {
    console.log("retrieveDataWithFingerprint error: " + err.code + ", " + err.message);
    // Inform the user of the error, that may or may not be recoverable, on your custom biometrics UI
  });
}
```

### `fingerprintEncryptedDataExists`

Call this method to check if you have encrypted data stored on this device.

#### TypeScript

```typescript
import { KeystoreAccess } from "nativescript-keystore-access";

class MyClass {
  private keystoreAccess: KeystoreAccess;

  constructor() {
    this.keystoreAccess = new KeystoreAccess();
  }

  if (this.keystoreAccess.fingerprintEncryptedDataExists(
    keystoreKeyAlias: "ALIAS" // A unique id for your data, use the same key for encryption and decryption of the same data, and another key for different data.
  )) {
    console.log("You have encrypted data store on this device, go ahead and retrieve it if you like");
  )
}
```

### `deleteFingerprintEncryptedData`

Call this method to delete any existing encrypted data stored on this device.

#### TypeScript

```typescript
import { KeystoreAccess } from "nativescript-keystore-access";

class MyClass {
  private keystoreAccess: KeystoreAccess;

  constructor() {
    this.keystoreAccess = new KeystoreAccess();
  }

  this.keystoreAccess.deleteFingerprintEncryptedData(
    keystoreKeyAlias: "ALIAS" // A unique id for your data, use the same key for encryption and decryption of the same data, and another key for different data.
  );
}
```

## Error Codes

The iOS and Android biometrics SDK are very different and reports errors very differently.
To make the usage of this plugin predictable without knowing what platform you are on, all error types have been mapped to one common finite list of error codes.
The error codes are the following:

```typescript
enum ERROR_CODES {
  RECOVERABLE_ERROR_BIOMETRICS_NOT_RECOGNIZED = 102, // Biometrics are working and configured correctly, but the biometric input was not recognized
  RECOVERABLE_ERROR_FINGER_MOVED_TO_FAST = 102, // Finger moved to fast on the fingerprint sensor (only Android)
  RECOVERABLE_ERROR_FINGER_MUST_COVER_SENSOR = 101, // Finger must cover entire sensor (only Android)
  DEVELOPER_ERROR = 10, // Unexpected error, report to maintainer of plugin please
  NOT_AVAILABLE = 20, // Biometrics are not available on device
  TAMPERED_WITH = -5, // Biometrics was changed (added or removed) since last successful authentication, maybe a hacker was on your device
  AUTHENTICATION_FAILED = -1, // Biometrics are working and configured correctly, but the biometric input was not recognized
  CANCEL = -2 // Biometric authentication was canceled, probably by user
}
```

## Face ID (iOS)
iOS 11 added support for Face ID and was first supported by the iPhone X.
The developer needs to provide a value for `NSFaceIDUsageDescription`, otherwise your app may crash.

You can provide this value (the reason for using Face ID) by adding something like this to `app/App_Resources/ios/Info.plist`:

```xml
  <key>NSFaceIDUsageDescription</key>
  <string>For easy authentication with our app.</string>
```

## License

This software is available under the MIT license.