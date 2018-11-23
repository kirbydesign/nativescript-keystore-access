import { Observable, EventData } from 'tns-core-modules/data/observable';
import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import {
    KeystoreAccess,
    BiometricIDAvailableResult
} from 'nativescript-keystore-access';
import * as dialogs from "tns-core-modules/ui/dialogs";

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    let page = <pages.Page>args.object;
    page.bindingContext = new KeystoreDemoComponent();
}

export class KeystoreDemoComponent extends Observable {
    public infoMessage: string;
    public secretText: string = "Dette er hemmeligt";
    private keystoreAccess: KeystoreAccess;
    private useCustomUI = false;

    constructor() {
        super();
        this.keystoreAccess = new KeystoreAccess();
    }

    available(): void {
        this.useCustomUI = false;
        this.set("infoMessage", ""); // Remove custom UI
        this.keystoreAccess.available().then(
            (result: BiometricIDAvailableResult) => {
                console.log("doCheckAvailable result: " + JSON.stringify(result));
                dialogs.alert("Biometric ID available? - " + (result.any ? (result.face ? "Face" : "Touch") : "NO"));
                this.useCustomUI = result.customUI;
            })
            .catch(err => {
                console.log("doCheckAvailable error: " + err.code + ", " + err.message);
                dialogs.alert("Error: " + err.code + ", " + err.message);
            });
    }

    encryptData(): void {
        if (this.useCustomUI) {
            this.set("infoMessage", "Scan yer finger now"); // Show custom UI
        }
        this.keystoreAccess.storeDataWithFingerprint("ALIAS", this.secretText, "Biometric Message").then(
            (result: void) => {
                console.log("storeDataWithFingerprint result: OK");
                this.set("infoMessage", ""); // Remove custom UI
                dialogs.alert("storeDataWithFingerprint result: OK");
            })
            .catch(err => {
                console.log("storeDataWithFingerprint error: " + err.code + ", " + err.message);
                this.set("infoMessage", ""); // Remove custom UI
                dialogs.alert("Error: " + err.code + ", " + err.message);
            });
    }

    decryptData(): void {
        if (this.useCustomUI) {
            this.set("infoMessage", "Scan yer finger now"); // Show custom UI
        }
        this.keystoreAccess.retrieveDataWithFingerprint("ALIAS", "PROMPT").then(
            (result: string) => {
                console.log("retrieveDataWithFingerprint result: " + result);
                this.set("infoMessage", ""); // Remove custom UI
                dialogs.alert("retrieveDataWithFingerprint result: " + result);
            })
            .catch(err => {
                console.log("retrieveDataWithFingerprint error: " + err.code + ", " + err.message);
                this.set("infoMessage", ""); // Remove custom UI
                dialogs.alert("Error: " + err.code + ", " + err.message);
            });
    }

    dataExists(): void {
        this.set("infoMessage", ""); // Remove custom UI
        if (this.keystoreAccess.fingerprintEncryptedDataExists("ALIAS")) {
            dialogs.alert("Encrypted data exists - YES");
        } else {
            dialogs.alert("Encrypted data exists - NO");
        }
    }

    deleteData(): void {
        this.set("infoMessage", ""); // Remove custom UI
        this.keystoreAccess.deleteFingerprintEncryptedData("ALIAS");
    }

}