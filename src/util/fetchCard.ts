import * as util from "./util";
import { Card } from "../Card";

export const scryfallURL = `https://api.scryfall.com/`;

/**
 * Function to handle retrieval a card from Scryfall's api
 * 
 * 
 * @param rawContent 
 * @returns Card object containing all information from the queried card.
 */

export async function fetchCard(rawContent: string): Promise<Card> {

    const specificPrintingRegex = /\{\{(.+?)\[(\w{2,5}),\s*(\d+)\]\}\}/;
    const printingMatch = rawContent.match(specificPrintingRegex);

    if (printingMatch) {

        const [, name, setCode, collectorNumber] = printingMatch;
        const url = `${scryfallURL}cards/${setCode.toLowerCase()}/${collectorNumber}`;
        const response = await util.throttledAxios(url);
        return new Card(response.data);

    } else {
        
        const url = `${scryfallURL}cards/named?fuzzy=${encodeURIComponent(rawContent)}`;
        const response = await util.throttledAxios(url);
        return new Card(response.data);
    }

}
