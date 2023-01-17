import React from 'react';
import { IModel } from '../interfaces/IHealth';
import { Server } from './server';

export function Model(props: { model: IModel }) {
    return (
        <div className='model'>
            <div>Model {props.model.name} [{props.model.state}]</div>
            <table>
                {props.model.servers.map((server) => <Server key={server.peer_id} server={server} />)}
            </table>
        </div>
    );
}