export enum EState {
    Offline = 0,
    Loading = 1,
    Online = 2,
    Unreachable = 3
}

export interface IBootstrapServer {
    online  : boolean
    peer    : string
}

export interface IBlock {
    block_index: number
    state: EState
    state_text: string
}

export interface IServer {
    block_indices: number[]
    cache_tokens_available: number
    dht_client_mode: boolean
    ok: boolean
    peer_id: string
    short_peer_id: string
    version: string
    throughput: number,
    blocks: IBlock[]
}

export interface IModel { 
    name: string
    original_name: string
    n_blocks: number
    servers: IServer[],
    state: string
}

export interface IHealth { 
    bootstrap_servers: IBootstrapServer[],
    models: IModel[],
}