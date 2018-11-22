var KeystoreAccess = require("nativescript-keystore-access").KeystoreAccess;
var keystoreAccess = new KeystoreAccess();

describe("greet function", function() {
    it("exists", function() {
        expect(keystoreAccess.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(keystoreAccess.greet()).toEqual("Hello, NS");
    });
});