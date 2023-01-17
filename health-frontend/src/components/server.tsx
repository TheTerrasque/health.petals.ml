import React from 'react';
import { IServer } from "../interfaces/IHealth";
import { OnlineState } from './status';

export function Server(props: { server: IServer }) {
    return (
        <tr>
            <td>{props.server.short_peer_id}</td>
            <td>{props.server.version}</td>
            <td>{props.server.throughput}</td>
            <td>{props.server.cache_tokens_available}</td>
            <td>{props.server.dht_client_mode ? "Full" : "Client"}</td>
            <td>{props.server.block_indices && props.server.block_indices[0] + ":" + props.server.block_indices[1]}</td>
            <td>{props.server.blocks.map((block) => <OnlineState state={block.state}/>)}</td>
        </tr>
    );
}