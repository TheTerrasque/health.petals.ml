import React from 'react';
import { IModel, IServer } from "../interfaces/IHealth";
import { Blocks } from './blocks';

export function Server(props: { server: IServer, model: IModel }) {
    const blocks = Blocks(props.server.blocks, props.model);
    return (
        <tr>
            <td title={props.server.peer_id}>{props.server.short_peer_id}</td>
            <td>{props.server.version}</td>
            <td>{props.server.throughput.toFixed(1)}</td>
            <td>{props.server.cache_tokens_available}</td>
            <td>{props.server.dht_client_mode ? "Client" : "Full"}</td>
            <td>{props.server.block_indices && props.server.block_indices.length == 2 && props.server.block_indices[0] + ":" + props.server.block_indices[1]}</td>
            {  blocks }
        </tr>
    );
}