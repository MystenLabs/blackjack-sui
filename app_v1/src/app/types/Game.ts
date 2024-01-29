export class Game {
    id: string;
    player: string;
    playerCards: number[];
    playerSum: number;
    dealerCards: number[];
    dealerSum: number;
    status: number;

    // Default/empty constructor
    constructor() {
        this.id = "";
        this.player = "";
        this.playerCards = [];
        this.playerSum = 0;
        this.dealerCards = [];
        this.dealerSum = 0;
        this.status = 0;
    }
}


export class GameMessage {
    gameId: string;
    packageId?: string;
    type?: string;
    playerCards: number[];
    playerScore: number;
    requestObjectId: string;

    constructor() {
        this.type = "";
        this.gameId = "";
        this.packageId = "";
        this.playerScore = 0;
        this.playerCards = [];
        this.requestObjectId = "";
    }
}