import * as utils from "tns-core-modules/utils/utils";
import {BiometricIDAvailableResult, ERROR_CODES, KeystoreAccessApi} from "./keystore-access.common";

const keychainItemIdentifier = "TouchIDKey";

export class KeystoreAccess implements KeystoreAccessApi {
    private keychainItemServiceName: string;

    available(): Promise<BiometricIDAvailableResult> {
        return new Promise((resolve, reject) => {
            try {
                const laContext = LAContext.new();
                const hasBio = laContext.canEvaluatePolicyError(LAPolicy.DeviceOwnerAuthenticationWithBiometrics);

                if (hasBio) {
                    // only supported on iOS9+, so check this.. if not supported just report back as false
                    if (utils.ios.MajorVersion < 9) {
                        resolve({
                            any: false,
                            customUI: false
                        });
                        return;
                    }
                    const FingerprintDatabaseStateKey = "FingerprintDatabaseStateKey";
                    const state = laContext.evaluatedPolicyDomainState;
                    if (state !== null) {
                        const stateStr = state.base64EncodedStringWithOptions(0);
                        const standardUserDefaults = utils.ios.getter(NSUserDefaults, NSUserDefaults.standardUserDefaults);
                        const storedState = standardUserDefaults.stringForKey(FingerprintDatabaseStateKey);

                        // Store enrollment
                        standardUserDefaults.setObjectForKey(stateStr, FingerprintDatabaseStateKey);
                        standardUserDefaults.synchronize();

                        // whenever a finger is added/changed/removed the value of the storedState changes,
                        // so compare agains a value we previously stored in the context of this app
                        const changed = storedState !== null && stateStr !== storedState;
                        if (changed) {
                            this.parseError(reject, ERROR_CODES.TAMPERED_WITH, "Biometrics was changed");
                            return;
                        }
                    }
                }

                resolve({
                    any: hasBio,
                    touch: hasBio && laContext.biometryType === 1, // LABiometryType.TypeTouchID,
                    face: hasBio && laContext.biometryType === 2, // LABiometryType.TypeFaceID,
                    customUI: false
                });

            } catch (ex) {
                console.trace(ex);
                // if no identities are enrolled, there will be an exception (so not using 'reject' here)
                resolve({
                    any: false,
                    customUI: false
                });
            }
        });
    }

    useCustomUI(): boolean {
        return false;
    }

    storeDataWithFingerprint(keystoreKeyAlias: string, data: string, biometricMessage: string): Promise<void> {
        this.keychainItemServiceName = keystoreKeyAlias;
        return new Promise((resolve, reject) => {
            try {
                const laContext = LAContext.new();
                if (!laContext.canEvaluatePolicyError(LAPolicy.DeviceOwnerAuthenticationWithBiometrics)) {
                    reject({
                            code: ERROR_CODES.NOT_AVAILABLE,
                            message: "Not available",
                        }
                    );
                    return;
                }

                laContext.localizedFallbackTitle = "";
                laContext.evaluatePolicyLocalizedReasonReply(
                    LAPolicy.DeviceOwnerAuthenticationWithBiometrics,
                    biometricMessage,
                    (ok, error) => {
                        if (ok) {
                            this.deleteFingerprintEncryptedData(keystoreKeyAlias);
                            if (this.createKeyChainEntry(laContext, data)) {
                                resolve();
                            }
                        } else {
                            this.parseError(reject, error.code, error.localizedDescription);
                        }
                    }
                );
            } catch (ex) {
                console.trace(ex);
                this.parseError(reject, ERROR_CODES.DEVELOPER_ERROR, ex.message);
            }
        });
    }

    retrieveDataWithFingerprint(keystoreKeyAlias: string, biometricPromptMessage: string): Promise<string> {
        this.keychainItemServiceName = keystoreKeyAlias;
        return new Promise((resolve, reject) => {
            try {
                const result = this.readKeyChainEntry(biometricPromptMessage);
                console.log("retrieveDataWithFingerprint: " + result);
                if (result) {
                    resolve(result);
                } else {
                    this.parseError(reject, ERROR_CODES.AUTHENTICATION_FAILED, "Decryption failed");
                }
            } catch (ex) {
                console.trace(ex);
                this.parseError(reject, ERROR_CODES.DEVELOPER_ERROR, ex.message);
            }
        });
    }

    fingerprintEncryptedDataExists(keystoreKeyAlias: string): boolean {
        this.keychainItemServiceName = keystoreKeyAlias;
        let attributes = NSMutableDictionary.new();
        attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
        attributes.setObjectForKey(keystoreKeyAlias, kSecAttrService);
        attributes.setObjectForKey(kSecMatchLimitOne, kSecMatchLimit);
        attributes.setObjectForKey(true, kSecReturnData);
        const privKeyRef = new interop.Reference<any>();
        let status = SecItemCopyMatching(attributes, privKeyRef);
        if (status == errSecSuccess) {
            return true;
        }
        return false;
    }

    deleteFingerprintEncryptedData(keystoreKeyAlias: string): void {
        this.keychainItemServiceName = keystoreKeyAlias;
        let attributes = NSMutableDictionary.new();
        attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
        attributes.setObjectForKey(keystoreKeyAlias, kSecAttrService);
        SecItemDelete(attributes);
    }

    cleanup(): void {
        // Do nothing
    }

    private createKeyChainEntry(context: LAContext, data: string): boolean {
        try {
            const accessControlRef = SecAccessControlCreateWithFlags(
                kCFAllocatorDefault,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                SecAccessControlCreateFlags.kSecAccessControlUserPresence,
                null
            );
            let attributes = NSMutableDictionary.new();
            attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
            attributes.setObjectForKey(keychainItemIdentifier, kSecAttrAccount);
            attributes.setObjectForKey(this.keychainItemServiceName, kSecAttrService);
            const content: NSString = NSString.stringWithUTF8String(data);
            const nsData: NSData = content.dataUsingEncoding(NSUTF8StringEncoding);
            attributes.setObjectForKey(nsData, kSecValueData);
            attributes.setObjectForKey(accessControlRef, kSecAttrAccessControl);
            attributes.setObjectForKey(context, kSecUseAuthenticationContext);
            SecItemAdd(attributes, null);
            return true;
        } catch (ex) {
            console.trace(ex);
        }
        return false;
    }

    private readKeyChainEntry(biometricPromptMessage: string): string {
        let attributes;
        try {
            attributes = NSMutableDictionary.new();
            attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
            attributes.setObjectForKey(this.keychainItemServiceName, kSecAttrService);
            attributes.setObjectForKey(true, kSecReturnData);
            attributes.setObjectForKey(biometricPromptMessage, kSecUseOperationPrompt);
            const privKeyRef = new interop.Reference<any>();
            let resultData: NSData;
            let status = SecItemCopyMatching(attributes, privKeyRef);
            if (status == errSecSuccess) {
                resultData = privKeyRef.value;
                const result = NSString.alloc().initWithDataEncoding(resultData, NSUTF8StringEncoding).substringFromIndex(0);// We need to do this to marshall it to a Typescript string
                return result;
            }
        } catch (ex) {
            console.trace(ex);
        }
        return null;
    }

    private parseError(reject: Function, code: number, message: string) {
        if (code == -1) {
            reject({
                code: ERROR_CODES.AUTHENTICATION_FAILED,
                message: message
            });
        } else if (code == -2 || code == -4 || code == -9) {
            reject({
                code: ERROR_CODES.CANCEL,
                message: message
            });
        } else if (code == -5) {
            reject({
                code: ERROR_CODES.TAMPERED_WITH,
                message: message
            });
        } else if (code == 10) {
            reject({
                code: ERROR_CODES.DEVELOPER_ERROR,
                message: message
            });
        } else if (code == 20) {
            reject({
                code: ERROR_CODES.NOT_AVAILABLE,
                message: message
            });
        }
    }

}