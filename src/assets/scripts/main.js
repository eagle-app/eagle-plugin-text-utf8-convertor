'use strict';
import Queue from '@scripts/queue';

const { Encoder } = require(`${__dirname}/modules`);

const fs = require('node:fs');
const utils = require(`${__dirname}/modules/utils`);

export default class {
    constructor() {
        this.isLoading = false;
        this.currentProcessIndex = 0;
        this.flesh = -1;

        this.taskQueue = new Queue();

        this.tempFolder = `${__dirname}/temp/`;

        this.tempFolder = `${__dirname}/temp/`;
        Encoder.createTempFolder(this.tempFolder);
    }

    async loadData() {
        this.isLoading = true;
        let items = await eagle.item.getSelected();
        const acceptExts = ['txt', 'json', 'csv', 'md', 'html', 'xml', 'log', 'conf', 'config', 'ini', 'yaml'];
        items = items.filter((item) => {
            return acceptExts.includes(item.ext);
        });
        this.taskQueue.enqueue(items);
        this.taskQueue.data.forEach(async (task) => {
            task.encoding = {};
            task.encoding.encoding = "";
            task.convertContent = "";
            task.content = "";
        });
        this.isLoading = false;

    }

    async processData() {
        // async queue process convert task
        const async = require('async');
        const queue = async.queue(async (task) => {
            try {
                await determineFileExtension(task.ext);
                task.convertBuffer = await Encoder.encode({
                    src: task.filePath,
                    toCharset: 'UTF-8'
                });                
                task.convertContent = task.convertBuffer.toString("utf-8").substring(0, 20);
                task.encoding = await Encoder.getEncoding(task.filePath);
                task.content = (await fs.promises.readFile(task.filePath)).toString("utf-8").substring(0, 20);
                setTimeout(() => {
                    return;
                }, 100);
            } catch (error) {
                throw error;
            }
        }, 1);
        queue.drain(() => {
            eagle.log.info('all items have been processed');
        });
        queue.error((error, task) => {
            eagle.log.error(`#${task.id} encoding error : ${error}`);
        });
        queue.push(this.taskQueue.data);
    }

    async convert() {
        this.currentProcessIndex = 0;
        await this.taskQueue.start({
            onProcess: async (task) => {
                eagle.log.info(`start encoding #${task.id} : ${task.name}.${task.ext}`);
                this.currentProcessIndex++;
                try {
                    await determineFileExtension(task.ext);


                    if (task.encoding.encoding === 'UTF-8') {
                        return null;
                    }

                    const id = task.id;
                    const ext = {
                        txt: 'txt'
                    }[task.ext];

                    const outputFilePath = require('path').normalize(
                        `${this.tempFolder}/${id}.${ext}`
                    );                    

                    fs.writeFileSync(outputFilePath, task.convertBuffer);

                    if (!fs.existsSync(outputFilePath)) {
                        throw "File not found, output error", "fileNotFound";
                    }

                    let convertedEncoding = await Encoder.getEncoding(outputFilePath);
                    if (convertedEncoding.encoding !== "UTF-8") {
                        throw "Encoding error", "encodingError";
                    }

                    const item = await eagle.item.getById(task.id);

                    await item.replaceFile(outputFilePath);
                    await utils.file.destroy(outputFilePath);

                    eagle.log.info(`end encoding #${task.id}`);

                    return null;
                } catch (error) {
                    eagle.log.error(`#${task.id} encoding error : ${error}`);
                    throw error;
                }
            }
        });
    }

    static getEncoding(src) {
        return Encoder.getEncoding(src);
    }
}


async function determineFileExtension(ext){
    const acceptExts = ['txt', 'json', 'csv', 'md', 'html', 'xml', 'log', 'conf', 'config', 'ini', 'yaml'];
    if (!acceptExts.includes(ext.toLowerCase())) {
        throw 'file extension not supported';
    }
}