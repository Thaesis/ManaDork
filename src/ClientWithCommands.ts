import { Client, Collection } from "discord.js"

export interface Command {
    data: any;
    execute: (...args: any[]) => any;
}

export class ClientWithCommands extends Client {
    commands: Collection<string, Command> = new Collection();
}