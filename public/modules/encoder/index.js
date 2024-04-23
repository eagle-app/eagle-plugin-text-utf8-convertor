const fs = require('fs');
const languageEncoding = require("./lib/detect-file-encoding-and-language");
const iconv = require("./lib/iconv-lite");
const { createFolder } = require("../utils/file");

module.exports = class {
    static async encode(params) {

        let removeInput;

        try {
            let input = params.src;
            eagle.log.info('convert txt Path:' + input);

            let buffer = await fs.promises.readFile(input);
            let originalEncoding = await languageEncoding(buffer);
            let stringDecoded = iconv.decode(buffer, originalEncoding.encoding);
            let bufferEncoded = iconv.encode(stringDecoded, params.toCharset);

            return bufferEncoded;
        } catch (err) {
            if (fs.existsSync(params.dist)) {
                await fs.promises.rm(params.dist);
            }
            if (removeInput) await removeInput();
            throw err;
        }

    }

    static async getEncoding(src) {
        var buffer = await fs.promises.readFile(src);
        var originalEncoding = await languageEncoding(buffer);
        return originalEncoding;
    }

    static async createTempFolder() {
        await createFolder(eagle.plugin.path + "/temp");
    }
}