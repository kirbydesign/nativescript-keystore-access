export interface BiometricIDAvailableResult {
    any: boolean;
    touch?: boolean;
    face?: boolean;
    reason?: string;
    customUI: boolean; // Returns true if you need to show your own biometrics UI
}

export enum ERROR_CODES {
    RECOVERABLE_ERROR_BIOMETRICS_NOT_RECOGNIZED = 102, // Biometrics are working and configured correctly, but the biometric input was not recognized
    RECOVERABLE_ERROR_FINGER_MOVED_TO_FAST = 102, // Finger moved to fast on the fingerprint sensor (only Android)
    RECOVERABLE_ERROR_FINGER_MUST_COVER_SENSOR = 101, // Finger must cover entire sensor (only Android)
    DEVELOPER_ERROR = 10, // Unexpected error, report to maintainer of plugin please
    NOT_AVAILABLE = 20, // Biometrics are not available on device
    TAMPERED_WITH = -5, // Biometrics was changed (added or removed) since last successful authentication, maybe a hacker was on your device
    AUTHENTICATION_FAILED = -1, // Biometrics are working and configured correctly, but the biometric input was not recognized
    CANCEL = -2 // Biometric authentication was canceled, probably by user
}

export interface KeystoreAccessApi {
    /**
     * Always check for availability before anything else.
     */
    available(): Promise<BiometricIDAvailableResult>;

    /**
     * Returns true if you need to show your own biometrics UI.
     */
    useCustomUI(): boolean;

    /**
     * Stores your "data" in a safe storage that is encrypted with your biometrics.
     */
    storeDataWithFingerprint(keystoreKeyAlias: string, data: string, biometricMessage: string): Promise<void>;

    /**
     * Retreives your previously stored data in unencrypted form.
     */
    retrieveDataWithFingerprint(keystoreKeyAlias: string, biometricPromptMessage: string): Promise<string>;

    /**
     * Check if you have previously stored data.
     */
    fingerprintEncryptedDataExists(keystoreKeyAlias: string): boolean;

    /**
     * Deletes your previously stored data.
     */
    deleteFingerprintEncryptedData(keystoreKeyAlias: string): void;

    /**
     * Always remember to call cleanup when finished or when leaving the current context, it is necessary to hook into your lifecycle model.
     */
    cleanup(): void;
}