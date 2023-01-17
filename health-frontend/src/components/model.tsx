import React from 'react';
import { IModel } from '../interfaces/IHealth';
import { Server } from './server';
import './model.css';

export function Model(props: { model: IModel }) {
    return (
        <div className='model'>
            <div>Model {props.model.name} [<span className={`model-state model-state-${props.model.state}`}>{props.model.state}</span>]</div>
            <div className='model-servers'>
            <table className='table-servers'>
                <thead className='table-light'>
                    <tr>
                        <th>Peer ID</th>
                        <th>Version</th>
                        <th>Throughput</th>
                        <th>Cache tokens</th>
                        <th>DHT mode</th>
                        <th>Blocks</th>
                            {Array.from({ length: props.model.n_blocks }, (_, i) => i + 1).map((index) => <th className='blockHeader' key={index}>{index}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {props.model.servers.map((server) => <Server key={server.peer_id} server={server} model={ props.model } />)}
                </tbody>
                </table>
            </div>
        </div>
    );
}