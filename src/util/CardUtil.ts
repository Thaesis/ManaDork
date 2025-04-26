import {
    AttachmentBuilder
} from "discord.js"
import { Card } from "../Card";
import { throttledAxios } from "./util";

export async function buildCardAttachments(card?: Card): Promise<AttachmentBuilder[]> {

    const attachments: AttachmentBuilder[] = [
        new AttachmentBuilder("./assets/thumbnail/scryfall.png", { name: "scryfall.png" })
    ];

    if (card && card.isTwoSided()) {
        attachments.push(await card.fetchMergedAttachment());
    }

    return attachments;
}

export async function fetchCardPrintings(printsSearchUri: string): Promise<string[]> {
    const response = await throttledAxios(printsSearchUri);
    const data = response.data;

    const sets = data.data.map((printing: any) => `${printing.set_name} (${printing.set.toUpperCase()})`);

    return sets;
}