import { BiometricIDAvailableResult, KeystoreAccessApi } from "./keystore-access.common";
export declare class KeystoreAccess implements KeystoreAccessApi {
    private keychainItemServiceName;
    available(): Promise<BiometricIDAvailableResult>;
    useCustomUI(): boolean;
    storeDataWithFingerprint(keystoreKeyAlias: string, data: string, biometricMessage: string): Promise<void>;
    retrieveDataWithFingerprint(keystoreKeyAlias: string, biometricPromptMessage: string): Promise<string>;
    fingerprintEncryptedDataExists(keystoreKeyAlias: string): boolean;
    deleteFingerprintEncryptedData(keystoreKeyAlias: string): void;
    cleanup(): void;
    private createKeyChainEntry(context, data);
    private readKeyChainEntry(biometricPromptMessage);
    private parseError(reject, code, message);
}
