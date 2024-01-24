export interface GameMessage {
    gameId: string;
    packageId?: string;
    type?: string;
    playerCards?: string[];
    playerScore?: string;
    requestObjectId?: string;
}