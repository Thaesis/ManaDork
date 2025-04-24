import Bottleneck from "bottleneck";
import axios, {AxiosRequestConfig} from "axios";
import sharp from "sharp"

export enum EmbedType {
    Default,
    Legalities,
    Rulings,
    Help
}

// Must rate limit scryfall requests! >100ms between queries
export const scryfallLimiter = new Bottleneck({
    minTime: 100
});

export async function throttledAxios(url: string, config?: AxiosRequestConfig) {
    return axios.get(url, config);
}

export function formatName(format: string): string {
    return format.charAt(0).toUpperCase() + format.slice(1);
}

export async function combineCardImages(imageFrontURI: string, imageBackURI: string): Promise<Buffer> {
    
    const [front, back] = await Promise.all([
        throttledAxios(imageFrontURI, { responseType: 'arraybuffer' }),
        throttledAxios(imageBackURI, { responseType: 'arraybuffer' })
    ]);

    const frontImage = sharp(front.data);
    const backImage = sharp(back.data);

    const frontMeta = await frontImage.metadata();
    const backMeta = await backImage.metadata();

    const buffer = await sharp({
        create: {
            width: (frontMeta.width ?? 0) + (backMeta.width ?? 0),
            height: Math.max(frontMeta.height ?? 0, backMeta.height ?? 0),
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        { input: await frontImage.toBuffer(), left: 0, top: 0},
        { input: await backImage.toBuffer(), left: frontMeta.width ?? 0, top: 0}
    ])
    .png()
    .toBuffer();

    return buffer;
}
