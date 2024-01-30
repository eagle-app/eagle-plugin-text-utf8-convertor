const fs = require('fs');
const languageEncoding = require("./lib/detect-file-encoding-and-language");
const iconv = require("./lib/iconv-lite");
const { createFolder } = require("../utils/file");

module.exports = class {
    static async encode(params) {

        let removeInput;

        try {
            let input = params.src;

            // NOTE: 好幾個 exe 不支援中文路徑，目前暫時針對 Windows 平台將輸入檔案先複製到系統 temp，以此做為路徑添加
            if (process.platform === 'win32') {
                const tempPath = path.normalize(
                    require('os').tmpdir() + '/' + Math.random().toString(36).substring(2) + '.' + params.ext
                );
                await fs.promises.copyFile(params.src, tempPath);
                input = tempPath;
                removeInput = async () => {
                    if (process.platform === 'win32' && input !== params.src) {
                        if (fs.existsSync(input)) {
                            await fs.promises.rm(input);
                        }
                    }
                };
            }

            eagle.log.info('convert txt Path:' + input);

            let buffer = await fs.promises.readFileSync(input);
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
        await createFolder("temp");
    }
}