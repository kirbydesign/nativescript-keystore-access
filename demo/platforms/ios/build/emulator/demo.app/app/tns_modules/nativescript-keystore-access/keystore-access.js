"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("tns-core-modules/utils/utils");
var keystore_access_common_1 = require("./keystore-access.common");
var keychainItemIdentifier = "TouchIDKey";
var KeystoreAccess = (function () {
    function KeystoreAccess() {
    }
    KeystoreAccess.prototype.available = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var laContext = LAContext.new();
                var hasBio = laContext.canEvaluatePolicyError(1);
                if (hasBio) {
                    if (utils.ios.MajorVersion < 9) {
                        resolve({
                            any: false,
                            customUI: false
                        });
                        return;
                    }
                    var FingerprintDatabaseStateKey = "FingerprintDatabaseStateKey";
                    var state = laContext.evaluatedPolicyDomainState;
                    if (state !== null) {
                        var stateStr = state.base64EncodedStringWithOptions(0);
                        var standardUserDefaults = utils.ios.getter(NSUserDefaults, NSUserDefaults.standardUserDefaults);
                        var storedState = standardUserDefaults.stringForKey(FingerprintDatabaseStateKey);
                        standardUserDefaults.setObjectForKey(stateStr, FingerprintDatabaseStateKey);
                        standardUserDefaults.synchronize();
                        var changed = storedState !== null && stateStr !== storedState;
                        if (changed) {
                            _this.parseError(reject, keystore_access_common_1.ERROR_CODES.TAMPERED_WITH, "Biometrics was changed");
                            return;
                        }
                    }
                }
                resolve({
                    any: hasBio,
                    touch: hasBio && laContext.biometryType === 1,
                    face: hasBio && laContext.biometryType === 2,
                    customUI: false
                });
            }
            catch (ex) {
                console.trace(ex);
                resolve({
                    any: false,
                    customUI: false
                });
            }
        });
    };
    KeystoreAccess.prototype.useCustomUI = function () {
        return false;
    };
    KeystoreAccess.prototype.storeDataWithFingerprint = function (keystoreKeyAlias, data, biometricMessage) {
        var _this = this;
        this.keychainItemServiceName = keystoreKeyAlias;
        return new Promise(function (resolve, reject) {
            try {
                var laContext_1 = LAContext.new();
                if (!laContext_1.canEvaluatePolicyError(1)) {
                    reject({
                        code: keystore_access_common_1.ERROR_CODES.NOT_AVAILABLE,
                        message: "Not available",
                    });
                    return;
                }
                laContext_1.localizedFallbackTitle = "";
                laContext_1.evaluatePolicyLocalizedReasonReply(1, biometricMessage, function (ok, error) {
                    if (ok) {
                        _this.deleteFingerprintEncryptedData(keystoreKeyAlias);
                        if (_this.createKeyChainEntry(laContext_1, data)) {
                            resolve();
                        }
                    }
                    else {
                        _this.parseError(reject, error.code, error.localizedDescription);
                    }
                });
            }
            catch (ex) {
                console.trace(ex);
                _this.parseError(reject, keystore_access_common_1.ERROR_CODES.DEVELOPER_ERROR, ex.message);
            }
        });
    };
    KeystoreAccess.prototype.retrieveDataWithFingerprint = function (keystoreKeyAlias, biometricPromptMessage) {
        var _this = this;
        this.keychainItemServiceName = keystoreKeyAlias;
        return new Promise(function (resolve, reject) {
            try {
                var result = _this.readKeyChainEntry(biometricPromptMessage);
                console.log("retrieveDataWithFingerprint: " + result);
                if (result) {
                    resolve(result);
                }
                else {
                    _this.parseError(reject, keystore_access_common_1.ERROR_CODES.AUTHENTICATION_FAILED, "Decryption failed");
                }
            }
            catch (ex) {
                console.trace(ex);
                _this.parseError(reject, keystore_access_common_1.ERROR_CODES.DEVELOPER_ERROR, ex.message);
            }
        });
    };
    KeystoreAccess.prototype.fingerprintEncryptedDataExists = function (keystoreKeyAlias) {
        this.keychainItemServiceName = keystoreKeyAlias;
        var attributes = NSMutableDictionary.new();
        attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
        attributes.setObjectForKey(keystoreKeyAlias, kSecAttrService);
        attributes.setObjectForKey(kSecMatchLimitOne, kSecMatchLimit);
        attributes.setObjectForKey(true, kSecReturnData);
        var privKeyRef = new interop.Reference();
        var status = SecItemCopyMatching(attributes, privKeyRef);
        if (status == errSecSuccess) {
            return true;
        }
        return false;
    };
    KeystoreAccess.prototype.deleteFingerprintEncryptedData = function (keystoreKeyAlias) {
        this.keychainItemServiceName = keystoreKeyAlias;
        var attributes = NSMutableDictionary.new();
        attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
        attributes.setObjectForKey(keystoreKeyAlias, kSecAttrService);
        SecItemDelete(attributes);
    };
    KeystoreAccess.prototype.cleanup = function () {
    };
    KeystoreAccess.prototype.createKeyChainEntry = function (context, data) {
        try {
            var accessControlRef = SecAccessControlCreateWithFlags(kCFAllocatorDefault, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, 1, null);
            var attributes = NSMutableDictionary.new();
            attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
            attributes.setObjectForKey(keychainItemIdentifier, kSecAttrAccount);
            attributes.setObjectForKey(this.keychainItemServiceName, kSecAttrService);
            var content = NSString.stringWithUTF8String(data);
            var nsData = content.dataUsingEncoding(NSUTF8StringEncoding);
            attributes.setObjectForKey(nsData, kSecValueData);
            attributes.setObjectForKey(accessControlRef, kSecAttrAccessControl);
            attributes.setObjectForKey(context, kSecUseAuthenticationContext);
            SecItemAdd(attributes, null);
            return true;
        }
        catch (ex) {
            console.trace(ex);
        }
        return false;
    };
    KeystoreAccess.prototype.readKeyChainEntry = function (biometricPromptMessage) {
        var attributes;
        try {
            attributes = NSMutableDictionary.new();
            attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
            attributes.setObjectForKey(this.keychainItemServiceName, kSecAttrService);
            attributes.setObjectForKey(true, kSecReturnData);
            attributes.setObjectForKey(biometricPromptMessage, kSecUseOperationPrompt);
            var privKeyRef = new interop.Reference();
            var resultData = void 0;
            var status_1 = SecItemCopyMatching(attributes, privKeyRef);
            if (status_1 == errSecSuccess) {
                resultData = privKeyRef.value;
                var result = NSString.alloc().initWithDataEncoding(resultData, NSUTF8StringEncoding).substringFromIndex(0);
                return result;
            }
        }
        catch (ex) {
            console.trace(ex);
        }
        return null;
    };
    KeystoreAccess.prototype.parseError = function (reject, code, message) {
        if (code == -1) {
            reject({
                code: keystore_access_common_1.ERROR_CODES.AUTHENTICATION_FAILED,
                message: message
            });
        }
        else if (code == -2 || code == -4 || code == -9) {
            reject({
                code: keystore_access_common_1.ERROR_CODES.CANCEL,
                message: message
            });
        }
        else if (code == -5) {
            reject({
                code: keystore_access_common_1.ERROR_CODES.TAMPERED_WITH,
                message: message
            });
        }
        else if (code == 10) {
            reject({
                code: keystore_access_common_1.ERROR_CODES.DEVELOPER_ERROR,
                message: message
            });
        }
        else if (code == 20) {
            reject({
                code: keystore_access_common_1.ERROR_CODES.NOT_AVAILABLE,
                message: message
            });
        }
    };
    return KeystoreAccess;
}());
exports.KeystoreAccess = KeystoreAccess;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5c3RvcmUtYWNjZXNzLmlvcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImtleXN0b3JlLWFjY2Vzcy5pb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvREFBc0Q7QUFDdEQsbUVBQW9HO0FBRXBHLElBQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDO0FBRTVDO0lBQUE7SUEwTkEsQ0FBQztJQXZORyxrQ0FBUyxHQUFUO1FBQUEsaUJBb0RDO1FBbkRHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtZQUMvQixJQUFJO2dCQUNBLElBQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDbEMsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLHNCQUFzQixHQUFrRCxDQUFDO2dCQUVsRyxJQUFJLE1BQU0sRUFBRTtvQkFFUixJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLENBQUMsRUFBRTt3QkFDNUIsT0FBTyxDQUFDOzRCQUNKLEdBQUcsRUFBRSxLQUFLOzRCQUNWLFFBQVEsRUFBRSxLQUFLO3lCQUNsQixDQUFDLENBQUM7d0JBQ0gsT0FBTztxQkFDVjtvQkFDRCxJQUFNLDJCQUEyQixHQUFHLDZCQUE2QixDQUFDO29CQUNsRSxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsMEJBQTBCLENBQUM7b0JBQ25ELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTt3QkFDaEIsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN6RCxJQUFNLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQzt3QkFDbkcsSUFBTSxXQUFXLEdBQUcsb0JBQW9CLENBQUMsWUFBWSxDQUFDLDJCQUEyQixDQUFDLENBQUM7d0JBR25GLG9CQUFvQixDQUFDLGVBQWUsQ0FB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QUUsQ0FBQyxDQUFDO1NBQ3JCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVPLG1DQUFVLEdBQWxCLFVBQW1CLE1BQWdCLEVBQUUsSUFBWSxFQUFFLE9BQWU7UUFDOUQsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWixNQUFNLENBQUM7Z0JBQ0gsSUFBSSxFQUFFLG9DQUFXLENBQUMscUJBQXFCO2dCQUN2QyxPQUFPLEVBQUUsT0FBTzthQUNuQixDQUFDLENBQUM7U0FDTjthQUFNLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDL0MsTUFBTSxDQUFDO2dCQUNILElBQUksRUFBRSxvQ0FBVyxDQUFDLE1BQU07Z0JBQ3hCLE9BQU8sRUFBRSxPQUFPO2FBQ25CLENBQUMsQ0FBQztTQUNOO2FBQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbkIsTUFBTSxDQUFDO2dCQUNILElBQUksRUFBRSxvQ0FBVyxDQUFDLGFBQWE7Z0JBQy9CLE9BQU8sRUFBRSxPQUFPO2FBQ25CLENBQUMsQ0FBQztTQUNOO2FBQU0sSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFO1lBQ25CLE1BQU0sQ0FBQztnQkFDSCxJQUFJLEVBQUUsb0NBQVcsQ0FBQyxlQUFlO2dCQUNqQyxPQUFPLEVBQUUsT0FBTzthQUNuQixDQUFDLENBQUM7U0FDTjthQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsRUFBRTtZQUNuQixNQUFNLENBQUM7Z0JBQ0gsSUFBSSxFQUFFLG9DQUFXLENBQUMsYUFBYTtnQkFDL0IsT0FBTyxFQUFFLE9BQU87YUFDbkIsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUwscUJBQUM7QUFBRCxDQUFDLEFBMU5ELElBME5DO0FBMU5ZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdXRpbHMvdXRpbHNcIjtcbmltcG9ydCB7QmlvbWV0cmljSURBdmFpbGFibGVSZXN1bHQsIEVSUk9SX0NPREVTLCBLZXlzdG9yZUFjY2Vzc0FwaX0gZnJvbSBcIi4va2V5c3RvcmUtYWNjZXNzLmNvbW1vblwiO1xuXG5jb25zdCBrZXljaGFpbkl0ZW1JZGVudGlmaWVyID0gXCJUb3VjaElES2V5XCI7XG5cbmV4cG9ydCBjbGFzcyBLZXlzdG9yZUFjY2VzcyBpbXBsZW1lbnRzIEtleXN0b3JlQWNjZXNzQXBpIHtcbiAgICBwcml2YXRlIGtleWNoYWluSXRlbVNlcnZpY2VOYW1lOiBzdHJpbmc7XG5cbiAgICBhdmFpbGFibGUoKTogUHJvbWlzZTxCaW9tZXRyaWNJREF2YWlsYWJsZVJlc3VsdD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvbnRleHQgPSBMQUNvbnRleHQubmV3KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzQmlvID0gbGFDb250ZXh0LmNhbkV2YWx1YXRlUG9saWN5RXJyb3IoTEFQb2xpY3kuRGV2aWNlT3duZXJBdXRoZW50aWNhdGlvbldpdGhCaW9tZXRyaWNzKTtcblxuICAgICAgICAgICAgICAgIGlmIChoYXNCaW8pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSBzdXBwb3J0ZWQgb24gaU9TOSssIHNvIGNoZWNrIHRoaXMuLiBpZiBub3Qgc3VwcG9ydGVkIGp1c3QgcmVwb3J0IGJhY2sgYXMgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlvcy5NYWpvclZlcnNpb24gPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbVVJOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRmluZ2VycHJpbnREYXRhYmFzZVN0YXRlS2V5ID0gXCJGaW5nZXJwcmludERhdGFiYXNlU3RhdGVLZXlcIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBsYUNvbnRleHQuZXZhbHVhdGVkUG9saWN5RG9tYWluU3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdGVTdHIgPSBzdGF0ZS5iYXNlNjRFbmNvZGVkU3RyaW5nV2l0aE9wdGlvbnMoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFuZGFyZFVzZXJEZWZhdWx0cyA9IHV0aWxzLmlvcy5nZXR0ZXIoTlNVc2VyRGVmYXVsdHMsIE5TVXNlckRlZmF1bHRzLnN0YW5kYXJkVXNlckRlZmF1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0b3JlZFN0YXRlID0gc3RhbmRhcmRVc2VyRGVmYXVsdHMuc3RyaW5nRm9yS2V5KEZpbmdlcnByaW50RGF0YWJhc2VTdGF0ZUtleSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIGVucm9sbG1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YW5kYXJkVXNlckRlZmF1bHRzLnNldE9iamVjdEZvcktleShzdGF0ZVN0ciwgRmluZ2VycHJpbnREYXRhYmFzZVN0YXRlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YW5kYXJkVXNlckRlZmF1bHRzLnN5bmNocm9uaXplKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdoZW5ldmVyIGEgZmluZ2VyIGlzIGFkZGVkL2NoYW5nZWQvcmVtb3ZlZCB0aGUgdmFsdWUgb2YgdGhlIHN0b3JlZFN0YXRlIGNoYW5nZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyBjb21wYXJlIGFnYWlucyBhIHZhbHVlIHdlIHByZXZpb3VzbHkgc3RvcmVkIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgYXBwXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VkID0gc3RvcmVkU3RhdGUgIT09IG51bGwgJiYgc3RhdGVTdHIgIT09IHN0b3JlZFN0YXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnNlRXJyb3IocmVqZWN0LCBFUlJPUl9DT0RFUy5UQU1QRVJFRF9XSVRILCBcIkJpb21ldHJpY3Mgd2FzIGNoYW5nZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIGFueTogaGFzQmlvLFxuICAgICAgICAgICAgICAgICAgICB0b3VjaDogaGFzQmlvICYmIGxhQ29udGV4dC5iaW9tZXRyeVR5cGUgPT09IDEsIC8vIExBQmlvbWV0cnlUeXBlLlR5cGVUb3VjaElELFxuICAgICAgICAgICAgICAgICAgICBmYWNlOiBoYXNCaW8gJiYgbGFDb250ZXh0LmJpb21ldHJ5VHlwZSA9PT0gMiwgLy8gTEFCaW9tZXRyeVR5cGUuVHlwZUZhY2VJRCxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tVUk6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS50cmFjZShleCk7XG4gICAgICAgICAgICAgICAgLy8gaWYgbm8gaWRlbnRpdGllcyBhcmUgZW5yb2xsZWQsIHRoZXJlIHdpbGwgYmUgYW4gZXhjZXB0aW9uIChzbyBub3QgdXNpbmcgJ3JlamVjdCcgaGVyZSlcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgYW55OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tVUk6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVzZUN1c3RvbVVJKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RvcmVEYXRhV2l0aEZpbmdlcnByaW50KGtleXN0b3JlS2V5QWxpYXM6IHN0cmluZywgZGF0YTogc3RyaW5nLCBiaW9tZXRyaWNNZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5rZXljaGFpbkl0ZW1TZXJ2aWNlTmFtZSA9IGtleXN0b3JlS2V5QWxpYXM7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29udGV4dCA9IExBQ29udGV4dC5uZXcoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWxhQ29udGV4dC5jYW5FdmFsdWF0ZVBvbGljeUVycm9yKExBUG9saWN5LkRldmljZU93bmVyQXV0aGVudGljYXRpb25XaXRoQmlvbWV0cmljcykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBFUlJPUl9DT0RFUy5OT1RfQVZBSUxBQkxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiTm90IGF2YWlsYWJsZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGFDb250ZXh0LmxvY2FsaXplZEZhbGxiYWNrVGl0bGUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIGxhQ29udGV4dC5ldmFsdWF0ZVBvbGljeUxvY2FsaXplZFJlYXNvblJlcGx5KFxuICAgICAgICAgICAgICAgICAgICBMQVBvbGljeS5EZXZpY2VPd25lckF1dGhlbnRpY2F0aW9uV2l0aEJpb21ldHJpY3MsXG4gICAgICAgICAgICAgICAgICAgIGJpb21ldHJpY01lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIChvaywgZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlRmluZ2VycHJpbnRFbmNyeXB0ZWREYXRhKGtleXN0b3JlS2V5QWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNyZWF0ZUtleUNoYWluRW50cnkobGFDb250ZXh0LCBkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnNlRXJyb3IocmVqZWN0LCBlcnJvci5jb2RlLCBlcnJvci5sb2NhbGl6ZWREZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLnRyYWNlKGV4KTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlRXJyb3IocmVqZWN0LCBFUlJPUl9DT0RFUy5ERVZFTE9QRVJfRVJST1IsIGV4Lm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXRyaWV2ZURhdGFXaXRoRmluZ2VycHJpbnQoa2V5c3RvcmVLZXlBbGlhczogc3RyaW5nLCBiaW9tZXRyaWNQcm9tcHRNZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICB0aGlzLmtleWNoYWluSXRlbVNlcnZpY2VOYW1lID0ga2V5c3RvcmVLZXlBbGlhcztcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5yZWFkS2V5Q2hhaW5FbnRyeShiaW9tZXRyaWNQcm9tcHRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInJldHJpZXZlRGF0YVdpdGhGaW5nZXJwcmludDogXCIgKyByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyc2VFcnJvcihyZWplY3QsIEVSUk9SX0NPREVTLkFVVEhFTlRJQ0FUSU9OX0ZBSUxFRCwgXCJEZWNyeXB0aW9uIGZhaWxlZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoZXgpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyc2VFcnJvcihyZWplY3QsIEVSUk9SX0NPREVTLkRFVkVMT1BFUl9FUlJPUiwgZXgubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZpbmdlcnByaW50RW5jcnlwdGVkRGF0YUV4aXN0cyhrZXlzdG9yZUtleUFsaWFzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgdGhpcy5rZXljaGFpbkl0ZW1TZXJ2aWNlTmFtZSA9IGtleXN0b3JlS2V5QWxpYXM7XG4gICAgICAgIGxldCBhdHRyaWJ1dGVzID0gTlNNdXRhYmxlRGljdGlvbmFyeS5uZXcoKTtcbiAgICAgICAgYXR0cmlidXRlcy5zZXRPYmplY3RGb3JLZXkoa1NlY0NsYXNzR2VuZXJpY1Bhc3N3b3JkLCBrU2VjQ2xhc3MpO1xuICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleShrZXlzdG9yZUtleUFsaWFzLCBrU2VjQXR0clNlcnZpY2UpO1xuICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleShrU2VjTWF0Y2hMaW1pdE9uZSwga1NlY01hdGNoTGltaXQpO1xuICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleSh0cnVlLCBrU2VjUmV0dXJuRGF0YSk7XG4gICAgICAgIGNvbnN0IHByaXZLZXlSZWYgPSBuZXcgaW50ZXJvcC5SZWZlcmVuY2U8YW55PigpO1xuICAgICAgICBsZXQgc3RhdHVzID0gU2VjSXRlbUNvcHlNYXRjaGluZyhhdHRyaWJ1dGVzLCBwcml2S2V5UmVmKTtcbiAgICAgICAgaWYgKHN0YXR1cyA9PSBlcnJTZWNTdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZGVsZXRlRmluZ2VycHJpbnRFbmNyeXB0ZWREYXRhKGtleXN0b3JlS2V5QWxpYXM6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLmtleWNoYWluSXRlbVNlcnZpY2VOYW1lID0ga2V5c3RvcmVLZXlBbGlhcztcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXMgPSBOU011dGFibGVEaWN0aW9uYXJ5Lm5ldygpO1xuICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleShrU2VjQ2xhc3NHZW5lcmljUGFzc3dvcmQsIGtTZWNDbGFzcyk7XG4gICAgICAgIGF0dHJpYnV0ZXMuc2V0T2JqZWN0Rm9yS2V5KGtleXN0b3JlS2V5QWxpYXMsIGtTZWNBdHRyU2VydmljZSk7XG4gICAgICAgIFNlY0l0ZW1EZWxldGUoYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgY2xlYW51cCgpOiB2b2lkIHtcbiAgICAgICAgLy8gRG8gbm90aGluZ1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlS2V5Q2hhaW5FbnRyeShjb250ZXh0OiBMQUNvbnRleHQsIGRhdGE6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYWNjZXNzQ29udHJvbFJlZiA9IFNlY0FjY2Vzc0NvbnRyb2xDcmVhdGVXaXRoRmxhZ3MoXG4gICAgICAgICAgICAgICAga0NGQWxsb2NhdG9yRGVmYXVsdCxcbiAgICAgICAgICAgICAgICBrU2VjQXR0ckFjY2Vzc2libGVXaGVuVW5sb2NrZWRUaGlzRGV2aWNlT25seSxcbiAgICAgICAgICAgICAgICBTZWNBY2Nlc3NDb250cm9sQ3JlYXRlRmxhZ3Mua1NlY0FjY2Vzc0NvbnRyb2xVc2VyUHJlc2VuY2UsXG4gICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxldCBhdHRyaWJ1dGVzID0gTlNNdXRhYmxlRGljdGlvbmFyeS5uZXcoKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuc2V0T2JqZWN0Rm9yS2V5KGtTZWNDbGFzc0dlbmVyaWNQYXNzd29yZCwga1NlY0NsYXNzKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuc2V0T2JqZWN0Rm9yS2V5KGtleWNoYWluSXRlbUlkZW50aWZpZXIsIGtTZWNBdHRyQWNjb3VudCk7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleSh0aGlzLmtleWNoYWluSXRlbVNlcnZpY2VOYW1lLCBrU2VjQXR0clNlcnZpY2UpO1xuICAgICAgICAgICAgY29uc3QgY29udGVudDogTlNTdHJpbmcgPSBOU1N0cmluZy5zdHJpbmdXaXRoVVRGOFN0cmluZyhkYXRhKTtcbiAgICAgICAgICAgIGNvbnN0IG5zRGF0YTogTlNEYXRhID0gY29udGVudC5kYXRhVXNpbmdFbmNvZGluZyhOU1VURjhTdHJpbmdFbmNvZGluZyk7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleShuc0RhdGEsIGtTZWNWYWx1ZURhdGEpO1xuICAgICAgICAgICAgYXR0cmlidXRlcy5zZXRPYmplY3RGb3JLZXkoYWNjZXNzQ29udHJvbFJlZiwga1NlY0F0dHJBY2Nlc3NDb250cm9sKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuc2V0T2JqZWN0Rm9yS2V5KGNvbnRleHQsIGtTZWNVc2VBdXRoZW50aWNhdGlvbkNvbnRleHQpO1xuICAgICAgICAgICAgU2VjSXRlbUFkZChhdHRyaWJ1dGVzLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgY29uc29sZS50cmFjZShleCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVhZEtleUNoYWluRW50cnkoYmlvbWV0cmljUHJvbXB0TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0gTlNNdXRhYmxlRGljdGlvbmFyeS5uZXcoKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuc2V0T2JqZWN0Rm9yS2V5KGtTZWNDbGFzc0dlbmVyaWNQYXNzd29yZCwga1NlY0NsYXNzKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuc2V0T2JqZWN0Rm9yS2V5KHRoaXMua2V5Y2hhaW5JdGVtU2VydmljZU5hbWUsIGtTZWNBdHRyU2VydmljZSk7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleSh0cnVlLCBrU2VjUmV0dXJuRGF0YSk7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnNldE9iamVjdEZvcktleShiaW9tZXRyaWNQcm9tcHRNZXNzYWdlLCBrU2VjVXNlT3BlcmF0aW9uUHJvbXB0KTtcbiAgICAgICAgICAgIGNvbnN0IHByaXZLZXlSZWYgPSBuZXcgaW50ZXJvcC5SZWZlcmVuY2U8YW55PigpO1xuICAgICAgICAgICAgbGV0IHJlc3VsdERhdGE6IE5TRGF0YTtcbiAgICAgICAgICAgIGxldCBzdGF0dXMgPSBTZWNJdGVtQ29weU1hdGNoaW5nKGF0dHJpYnV0ZXMsIHByaXZLZXlSZWYpO1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PSBlcnJTZWNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0RGF0YSA9IHByaXZLZXlSZWYudmFsdWU7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gTlNTdHJpbmcuYWxsb2MoKS5pbml0V2l0aERhdGFFbmNvZGluZyhyZXN1bHREYXRhLCBOU1VURjhTdHJpbmdFbmNvZGluZykuc3Vic3RyaW5nRnJvbUluZGV4KDApOy8vIFdlIG5lZWQgdG8gZG8gdGhpcyB0byBtYXJzaGFsbCBpdCB0byBhIFR5cGVzY3JpcHQgc3RyaW5nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoZXgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgcGFyc2VFcnJvcihyZWplY3Q6IEZ1bmN0aW9uLCBjb2RlOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoY29kZSA9PSAtMSkge1xuICAgICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgICAgICBjb2RlOiBFUlJPUl9DT0RFUy5BVVRIRU5USUNBVElPTl9GQUlMRUQsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PSAtMiB8fCBjb2RlID09IC00IHx8IGNvZGUgPT0gLTkpIHtcbiAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgY29kZTogRVJST1JfQ09ERVMuQ0FOQ0VMLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT0gLTUpIHtcbiAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgY29kZTogRVJST1JfQ09ERVMuVEFNUEVSRURfV0lUSCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09IDEwKSB7XG4gICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgIGNvZGU6IEVSUk9SX0NPREVTLkRFVkVMT1BFUl9FUlJPUixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09IDIwKSB7XG4gICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgIGNvZGU6IEVSUk9SX0NPREVTLk5PVF9BVkFJTEFCTEUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iXX0=