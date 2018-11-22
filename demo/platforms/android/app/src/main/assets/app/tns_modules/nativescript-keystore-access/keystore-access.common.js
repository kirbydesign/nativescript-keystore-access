"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ERROR_CODES;
(function (ERROR_CODES) {
    ERROR_CODES[ERROR_CODES["RECOVERABLE_ERROR_BIOMETRICS_NOT_RECOGNIZED"] = 102] = "RECOVERABLE_ERROR_BIOMETRICS_NOT_RECOGNIZED";
    ERROR_CODES[ERROR_CODES["RECOVERABLE_ERROR_FINGER_MOVED_TO_FAST"] = 102] = "RECOVERABLE_ERROR_FINGER_MOVED_TO_FAST";
    ERROR_CODES[ERROR_CODES["RECOVERABLE_ERROR_FINGER_MUST_COVER_SENSOR"] = 101] = "RECOVERABLE_ERROR_FINGER_MUST_COVER_SENSOR";
    ERROR_CODES[ERROR_CODES["DEVELOPER_ERROR"] = 10] = "DEVELOPER_ERROR";
    ERROR_CODES[ERROR_CODES["NOT_AVAILABLE"] = 20] = "NOT_AVAILABLE";
    ERROR_CODES[ERROR_CODES["TAMPERED_WITH"] = -5] = "TAMPERED_WITH";
    ERROR_CODES[ERROR_CODES["AUTHENTICATION_FAILED"] = -1] = "AUTHENTICATION_FAILED";
    ERROR_CODES[ERROR_CODES["CANCEL"] = -2] = "CANCEL";
})(ERROR_CODES = exports.ERROR_CODES || (exports.ERROR_CODES = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5c3RvcmUtYWNjZXNzLmNvbW1vbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImtleXN0b3JlLWFjY2Vzcy5jb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSxJQUFZLFdBU1g7QUFURCxXQUFZLFdBQVc7SUFDbkIsNkhBQWlELENBQUE7SUFDakQsbUhBQTRDLENBQUE7SUFDNUMsMkhBQWdELENBQUE7SUFDaEQsb0VBQW9CLENBQUE7SUFDcEIsZ0VBQWtCLENBQUE7SUFDbEIsZ0VBQWtCLENBQUE7SUFDbEIsZ0ZBQTBCLENBQUE7SUFDMUIsa0RBQVcsQ0FBQTtBQUNmLENBQUMsRUFUVyxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQVN0QiIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBpbnRlcmZhY2UgQmlvbWV0cmljSURBdmFpbGFibGVSZXN1bHQge1xuICAgIGFueTogYm9vbGVhbjtcbiAgICB0b3VjaD86IGJvb2xlYW47XG4gICAgZmFjZT86IGJvb2xlYW47XG4gICAgcmVhc29uPzogc3RyaW5nO1xuICAgIGN1c3RvbVVJOiBib29sZWFuOy8vIFJldHVybnMgdHJ1ZSBpZiB5b3UgbmVlZCB0byBzaG93IHlvdXIgb3duIGJpb21ldHJpY3MgVUlcbn1cblxuZXhwb3J0IGVudW0gRVJST1JfQ09ERVMge1xuICAgIFJFQ09WRVJBQkxFX0VSUk9SX0JJT01FVFJJQ1NfTk9UX1JFQ09HTklaRUQgPSAxMDIsIC8vIEJpb21ldHJpY3MgYXJlIHdvcmtpbmcgYW5kIGNvbmZpZ3VyZWQgY29ycmVjdGx5LCBidXQgdGhlIGJpb21ldHJpYyBpbnB1dCB3YXMgbm90IHJlY29nbml6ZWRcbiAgICBSRUNPVkVSQUJMRV9FUlJPUl9GSU5HRVJfTU9WRURfVE9fRkFTVCA9IDEwMiwgLy8gRmluZ2VyIG1vdmVkIHRvIGZhc3Qgb24gdGhlIGZpbmdlcnByaW50IHNlbnNvciAob25seSBBbmRyb2lkKVxuICAgIFJFQ09WRVJBQkxFX0VSUk9SX0ZJTkdFUl9NVVNUX0NPVkVSX1NFTlNPUiA9IDEwMSwgLy8gRmluZ2VyIG11c3QgY292ZXIgZW50aXJlIHNlbnNvciAob25seSBBbmRyb2lkKVxuICAgIERFVkVMT1BFUl9FUlJPUiA9IDEwLCAvLyBVbmV4cGVjdGVkIGVycm9yLCByZXBvcnQgdG8gbWFpbnRhaW5lciBvZiBwbHVnaW4gcGxlYXNlXG4gICAgTk9UX0FWQUlMQUJMRSA9IDIwLCAvLyBCaW9tZXRyaWNzIGFyZSBub3QgYXZhaWxhYmxlIG9uIGRldmljZVxuICAgIFRBTVBFUkVEX1dJVEggPSAtNSwgLy8gQmlvbWV0cmljcyB3YXMgY2hhbmdlZCAoYWRkZWQgb3IgcmVtb3ZlZCkgc2luY2UgbGFzdCBzdWNjZXNzZnVsIGF1dGhlbnRpY2F0aW9uLCBtYXliZSBhIGhhY2tlciB3YXMgb24geW91ciBkZXZpY2VcbiAgICBBVVRIRU5USUNBVElPTl9GQUlMRUQgPSAtMSwgLy8gQmlvbWV0cmljcyBhcmUgd29ya2luZyBhbmQgY29uZmlndXJlZCBjb3JyZWN0bHksIGJ1dCB0aGUgYmlvbWV0cmljIGlucHV0IHdhcyBub3QgcmVjb2duaXplZFxuICAgIENBTkNFTCA9IC0yIC8vIEJpb21ldHJpYyBhdXRoZW50aWNhdGlvbiB3YXMgY2FuY2VsZWQsIHByb2JhYmx5IGJ5IHVzZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLZXlzdG9yZUFjY2Vzc0FwaSB7XG4gICAgLyoqXG4gICAgICogQWx3YXlzIGNoZWNrIGZvciBhdmFpbGFiaWxpdHkgYmVmb3JlIGFueXRoaW5nIGVsc2UuXG4gICAgICovXG4gICAgYXZhaWxhYmxlKCk6IFByb21pc2U8QmlvbWV0cmljSURBdmFpbGFibGVSZXN1bHQ+O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHlvdSBuZWVkIHRvIHNob3cgeW91ciBvd24gYmlvbWV0cmljcyBVSS5cbiAgICAgKi9cbiAgICB1c2VDdXN0b21VSSgpOiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogU3RvcmVzIHlvdXIgXCJkYXRhXCIgaW4gYSBzYWZlIHN0b3JhZ2UgdGhhdCBpcyBlbmNyeXB0ZWQgd2l0aCB5b3VyIGJpb21ldHJpY3MuXG4gICAgICovXG4gICAgc3RvcmVEYXRhV2l0aEZpbmdlcnByaW50KGtleXN0b3JlS2V5QWxpYXM6IHN0cmluZywgZGF0YTogc3RyaW5nLCBiaW9tZXRyaWNNZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLyoqXG4gICAgICogUmV0cmVpdmVzIHlvdXIgcHJldmlvdXNseSBzdG9yZWQgZGF0YSBpbiB1bmVuY3J5cHRlZCBmb3JtLlxuICAgICAqL1xuICAgIHJldHJpZXZlRGF0YVdpdGhGaW5nZXJwcmludChrZXlzdG9yZUtleUFsaWFzOiBzdHJpbmcsIGJpb21ldHJpY1Byb21wdE1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHlvdSBoYXZlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEuXG4gICAgICovXG4gICAgZmluZ2VycHJpbnRFbmNyeXB0ZWREYXRhRXhpc3RzKGtleXN0b3JlS2V5QWxpYXM6IHN0cmluZyk6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIHlvdXIgcHJldmlvdXNseSBzdG9yZWQgZGF0YS5cbiAgICAgKi9cbiAgICBkZWxldGVGaW5nZXJwcmludEVuY3J5cHRlZERhdGEoa2V5c3RvcmVLZXlBbGlhczogc3RyaW5nKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIEFsd2F5cyByZW1lbWJlciB0byBjYWxsIGNsZWFudXAgd2hlbiBmaW5pc2hlZCBvciB3aGVuIGxlYXZpbmcgdGhlIGN1cnJlbnQgY29udGV4dCwgaXQgaXMgbmVjZXNzYXJ5IHRvIGhvb2sgaW50byB5b3VyIGxpZmVjeWNsZSBtb2RlbC5cbiAgICAgKi9cbiAgICBjbGVhbnVwKCk6IHZvaWQ7XG59Il19