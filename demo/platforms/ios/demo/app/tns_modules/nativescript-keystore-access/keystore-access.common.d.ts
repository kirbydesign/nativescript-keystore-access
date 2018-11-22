export interface BiometricIDAvailableResult {
    any: boolean;
    touch?: boolean;
    face?: boolean;
    reason?: string;
    customUI: boolean;
}
export declare enum ERROR_CODES {
    RECOVERABLE_ERROR_BIOMETRICS_NOT_RECOGNIZED = 102,
    RECOVERABLE_ERROR_FINGER_MOVED_TO_FAST = 102,
    RECOVERABLE_ERROR_FINGER_MUST_COVER_SENSOR = 101,
    DEVELOPER_ERROR = 10,
    NOT_AVAILABLE = 20,
    TAMPERED_WITH = -5,
    AUTHENTICATION_FAILED = -1,
    CANCEL = -2,
}
export interface KeystoreAccessApi {
    available(): Promise<BiometricIDAvailableResult>;
    useCustomUI(): boolean;
    storeDataWithFingerprint(keystoreKeyAlias: string, data: string, biometricMessage: string): Promise<void>;
    retrieveDataWithFingerprint(keystoreKeyAlias: string, biometricPromptMessage: string): Promise<string>;
    fingerprintEncryptedDataExists(keystoreKeyAlias: string): boolean;
    deleteFingerprintEncryptedData(keystoreKeyAlias: string): void;
    cleanup(): void;
}
