const fs = require("fs-extra");
const assert = require("assert");

const { default: ImageDataURI } = require("../dist/image-data-uri");

const matchMediaType = /^data:([^;,]+)[;,]/;

describe("ImageDataURI", () => {
    describe("encodeFromFile", () => {
        it("declares correct media type for test-file.jpg", async () => {
            const dataURI = await ImageDataURI.encodeFromFile("test/test-file.jpg");
            const m = dataURI.match(matchMediaType);

            assert.strictEqual("image/jpeg", m[ 1 ]);
        });

        it("declares correct media type for test-file-alternate.jpeg", async () => {
            const dataURI = await ImageDataURI.encodeFromFile("test/test-file-alternate.jpeg");
            const m = dataURI.match(matchMediaType);

            assert.strictEqual("image/jpeg", m[ 1 ]);
        });

        it("declares correct media type for test-file.svg", async () => {
            const dataURI = await ImageDataURI.encodeFromFile("test/test-file.svg");
            const m = dataURI.match(matchMediaType);

            assert.strictEqual("image/svg+xml", m[ 1 ]);
        });

        it("fails when media type is unknown", async () => {
            try {
                return await ImageDataURI.encodeFromFile("unknown");
            } catch (error) {
                assert.strictEqual(
                    "ImageDataURI :: Error :: Couldn't recognize media type for file",
                    error.message
                );
            }
        });
    });

    describe("encodeFromURL", () => {
        it("declares correct media type for a google logo", async () => {
            const dataURI = await ImageDataURI.encodeFromURL("https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png");
            const m = dataURI.match(matchMediaType);

            assert.strictEqual("image/png", m[ 1 ]);
        });

        it("fails on a 404 URL", async () => {
            try {
                // TODO: tried to use example.com but it doesn't return 404 for
                // unknown paths.  I'd rather not use Google but at least it's
                // less opaque than the URL that used to be here.
                return await ImageDataURI.encodeFromURL("https://google.com/foo.png");
            } catch (err) {
                assert.match(err.message, /returned an HTTP 404 status/);
            }
        });
    });

    describe("outputFile", () => {
        const outputFilePath = `${__dirname}/tmp-output`;
        const expectedOutputFile = `${__dirname}/tmp-output.svg`;

        it("writes image/svg+xml data to a file with .svg extension", async () => {
            const dataURI = await ImageDataURI.encodeFromFile("test/test-file.svg");
            const outputPath = await ImageDataURI.outputFile(dataURI, outputFilePath);

            return assert.strictEqual(expectedOutputFile, outputPath);
        });

        after(function() {
            fs.removeSync(expectedOutputFile);
        });
    });
});
