interface Deck {
    ownerId: string;
    name: string;
    cards: { name: string; quantity: number} [];
}