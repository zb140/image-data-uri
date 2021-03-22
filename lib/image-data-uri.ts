import path from 'path';

import fs from 'fs-extra';
import mimeTypes from 'mime-types';
import got, { HTTPError } from 'got';

export interface DecodedImage {
    imageType: string;
    dataBase64: string;
    dataBuffer: Buffer;
}

export interface ImageDataURIOptions {
    timeout?: number;
}

export default class ImageDataURI {
    static decode(dataURI: string): DecodedImage | null {
        if (!/data:image\//.test(dataURI)) {
            console.log('ImageDataURI :: Error :: It seems that it is not an Image Data URI. Couldn\'t match "data:image\/"');
            return null;
        }

        let regExMatches = dataURI.match('data:(image/.*);base64,(.*)');
        if (!regExMatches) return null;

        return {
            imageType: regExMatches[1],
            dataBase64: regExMatches[2],
            dataBuffer: Buffer.from(regExMatches[2], 'base64')
        };
    }

    static encode(data: any, mediaType: string): string | null {
        if (!data || !mediaType) {
            console.log(`ImageDataURI :: Error :: Missing some of the required params: data, mediaType  ${mediaType} ${data}`);
            return null;
        }

        mediaType = (/\//.test(mediaType)) ? mediaType : 'image/' + mediaType;
        const dataBase64 = (Buffer.isBuffer(data)) ? data.toString('base64') : Buffer.from(data).toString('base64');
        const dataImgBase64 = 'data:' + mediaType + ';base64,' + dataBase64;

        return dataImgBase64;
    }

    static async encodeFromFile(filePath: string): Promise<string | null> {
        if (!filePath) {
            throw new Error('ImageDataURI :: Error :: Missing some of the required params: filePath');
        }

        const mediaType = mimeTypes.lookup(filePath);
        if (!mediaType) {
            throw new Error('ImageDataURI :: Error :: Couldn\'t recognize media type for file');
        }

        try {
            const data = await fs.readFile(filePath);
            return ImageDataURI.encode(data, mediaType);
        } catch (err) {
            throw new Error('ImageDataURI :: Error :: ' + JSON.stringify(err, null, 4));
        }
    }

    static async encodeFromURL(imageURL: string, options?: ImageDataURIOptions): Promise<string | null> {
        if (!imageURL) {
            throw new Error('ImageDataURI :: Error :: Missing some of the required params: imageURL');
        }

        try {
            const response = await got(imageURL, { responseType: 'buffer', timeout: options?.timeout || 6000 });
            if (response.statusCode === 200 && response.headers['content-type']) {
                return ImageDataURI.encode(response.body, response.headers["content-type"]);
            }
            return null;
        } catch (err) {
            if (err instanceof HTTPError) {
                throw new Error('ImageDataURI :: Error :: GET -> ' + imageURL + ' returned an HTTP ' + err.response.statusCode + ' status!')
            }
            throw new Error('ImageDataURI :: Error :: ' + JSON.stringify(err, null, 4));
        }
    }

    static async outputFile(dataURI: string, filePath: string = './'): Promise<any> {
        let imageDecoded = ImageDataURI.decode(dataURI);
        if (!imageDecoded) throw new Error(`Error while decoding dataURI`);

        filePath = (!!path.extname(filePath))
            ? filePath
            : filePath + '.' + mimeTypes.extension(imageDecoded.imageType);

        try {
            await fs.outputFile(filePath, imageDecoded.dataBuffer);
        } catch (err) {
            throw new Error('ImageDataURI :: Error :: ' + JSON.stringify(err, null, 4));
        }

        return filePath;
    }
}
