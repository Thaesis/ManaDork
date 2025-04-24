import { 
    Attachment,
    AttachmentBuilder,
    EmbedBuilder, 
    
} from "discord.js";
import * as util from "./util"

export class Card {
    name: string;
    usd: string | null;
    usdFoil: string | null;
    eur: string | null;
    eurFoil: string | null;
    image_front: string;
    image_back: string;
    image_filename: string;
    text: string | null;
    gameChanger: boolean;
    legalities: Record<string, string>
    keywords: string[];
    link: string;
    setName: string;
    set: string;
    printings: any[];
    printsSearchUri: string;
    rulingsUri: string;
    rulings: any[];

    constructor(data: any) {
        this.name = data.name;
        this.usd = data.prices?.usd ?? null;
        this.usdFoil = data.prices?.usd_foil ?? null;
        this.eur = data.prices?.eur ?? null;
        this.eurFoil = data.prices?.eur_foil ?? null;

        // Handling single/double faced cards
        if (data.card_faces?.length === 2) {
            this.image_front = data.card_faces[0]?.image_uris?.normal ?? "";
            this.image_back  = data.card_faces[1]?.image_uris?.normal ?? "";
        } else {
            // Single-faced card
            this.image_front = data.image_uris?.normal ?? "";
            this.image_back  = "";
        }

        this.image_filename = "";
        this.text = 
            data.printed_text ??
            data.oracle_text ??
            data.card_faces?.[0]?.printed_text ??
            data.card_faces?.[0]?.oracle_text ??
            "No Card Text Available."

        this.gameChanger = data.game_changer;
        this.legalities = data.legalities ?? {};
        this.keywords = data.keywords ?? null;
        this.link = data.scryfall_uri;
        this.setName = data.set_name ?? null;
        this.set = data.set ?? null;
        this.printings = [];
        this.printsSearchUri = data.prints_search_uri ?? null;
        this.rulingsUri = data.rulings_uri ?? null;
        this.rulings = [];
    }

    async loadPrintings(): Promise<void> {
        if (!this.printsSearchUri) return;

        const printings: any[] = [];
        let uri = this.printsSearchUri;
        
        while (uri) {
            const res = await fetch(uri);
            const json = await res.json();
            printings.push(...json.data);
            uri = json.has_more ? json.next_page : null;
        }

        this.printings = printings;
    }

    async loadRulings(): Promise<void> {
        const res = await util.throttledAxios(this.rulingsUri);
        const rulingsData = res.data.data;
        this.rulings = rulingsData;
    }

    async fetchMergedAttachment(): Promise<AttachmentBuilder> {
        const buffer = await util.combineCardImages(this.image_front, this.image_back);
        const fileName = `${this.name.replace(/\s+/g, "_")}.png`;
        console.log(`Name:${this.name}, Filename:${fileName}`); 
        this.image_filename = fileName;
        return new AttachmentBuilder(buffer, { name: fileName });
    }   

    getLegalities(): string {
        return Object.entries(this.legalities)
            .map(([format, status]) => `•${util.formatName(format)}: ${status}`)
            .join("\n");
    }

    getIllegalFormats(): string {
        return Object.entries(this.legalities)
            .filter(([_, status]) => status === "not_legal" || status === "banned" || status === "restricted") 
            .map(([format, status]) => `${format}: ${status}`)
            .join("\n");
    }

    getBannedFormats(): string[] {
        return Object.entries(this.legalities)
            .filter(([_, status]) => status === "banned")
            .map(([format]) => util.formatName(format));
    }

    getKeywords(): string {
        return this.keywords.join(", ");
    }

    getRulings(): string[] {
        return this.rulings
            .slice()
            .reverse()
            .map((r: any) => `• **${r.source.toUpperCase()}** (*${r.published_at}*):\n${r.comment}\n`);
    }

    fetchImage(): string {

        if(!this.image_back) {
            return this.image_front;
        } else {
            console.log(`${this.image_front}, ${this.image_back}, ${this.image_filename}`)
            return `attachment://${this.image_filename}.png`;
        }

    }

    isTwoSided(): boolean {
        return this.image_back ? true : false;
    }

    paginatePrintings(page: number, perPage = 5) {
        const totalPages = Math.ceil(this.printings.length / perPage);
        const start = (page - 1) * perPage;
        const entries = this.printings
            .slice(start, start + perPage)
            .map(p => `• ${p.set_name} (${p.set.toUpperCase()})`);
        return { entries, currentPage: page, totalPages };
    }

    getSetEmbed(page: number, perPage = 20): EmbedBuilder {
        const { entries, currentPage, totalPages } = this.paginatePrintings(page, perPage);
            return new EmbedBuilder()
                .setTitle(`Printings of ${this.name}`)
                .setImage(this.fetchImage())
                .setThumbnail("attachment://scryfall.png")
                .setDescription(entries.join('\n') || 'No printings found.')
                .setColor(0xb08ee8)
                .setFooter({ text: `Page ${currentPage} of ${totalPages}` });
    }

    getEmbed(type: util.EmbedType = util.EmbedType.Default): EmbedBuilder {

        switch (type) {
            case util.EmbedType.Legalities:
                return new EmbedBuilder()
                    .setTitle(this.name)
                    .setURL(this.link)
                    .setImage(this.fetchImage())
                    .setThumbnail("attachment://scryfall.png")
                    .setDescription(this.getLegalities())
                    .setColor(0xb08ee8)
                    .setFooter({ text: "All information is provided by Scryfall."})
            
            case util.EmbedType.Rulings:

                const rulings = this.getRulings().slice(0,5).join('\n') || `No Rulings Found for **${this.name}**`;

                return new EmbedBuilder()
                    .setTitle(this.name)
                    .setURL(this.link)
                    .setImage(this.fetchImage())
                    .setThumbnail("attachment://scryfall.png")
                    .setDescription(rulings)
                    .setColor(0xb08ee8)
                    .setFooter({ text: "All information is provided by Scryfall."})

            case util.EmbedType.Default:
            default:

                const fields = [];
                
                if(this.gameChanger) {
                    fields.push({
                        name: `**Game Changer**: :white_check_mark:`,
                        value: ""
                    });
                } else {
                    fields.push({
                        name: `**Game Changer**: :x:`,
                        value: ""
                    });
                }

                const bannedList = this.getBannedFormats();

                if(bannedList.length > 0) {
                    fields.push({
                        name: ":bangbang: Banned Card!",
                        value: `${bannedList.map(format => `• ${format}`).join('\n')}`
                    });
                }

                if(this.keywords.length > 0) {
                    fields.push({
                        name: `**Keywords**: ${this.getKeywords()}`,
                        value: ""
                    });
                }

                // Set information
                fields.push({
                    name: `**Set**: *${this.setName} (${this.set.toUpperCase()})*`,
                    value: ""
                })

                fields.push({
                    name: `**Price Summary**`,
                    value: `:dollar: *USD*: $${this.usd ?? "N/A"}     :sparkles: *Foil*: $${this.usdFoil ?? "N/A"} \n :euro: *EUR*: €${this.eur ?? "N/A"}     :sparkles: *Foil* €${this.eurFoil ?? "N/A"}:`
                })

                return new EmbedBuilder()
                    .setTitle(this.name)
                    .setURL(this.link)
                    .setImage(this.fetchImage())
                    .setThumbnail("attachment://scryfall.png")
                    .setDescription(`Information for ${this.name}`)
                    .addFields(fields)
                    .setColor(0xb08ee8)
                    .setFooter({ text: "All information is provided by Scryfall. Prices may not reflect current market value."});     
        }
    }

}