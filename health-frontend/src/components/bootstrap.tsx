import React from 'react';
import { EState, IBootstrapServer } from '../interfaces/IHealth';
import { OnlineState } from './status';

export function Bootstrap(props: { servers: IBootstrapServer[] }) {
    return (
        <div className='bootstrap-server-status-wrapper'>
            <span>Bootstrap servers: </span>

            <span className='bootstrap-server-status'>
                {props.servers.map((server) => 
                    <OnlineState state={server.online ? EState.Online : EState.Offline} key={server.peer} text={server.peer} />
                )}
            </span>
        </div>);
}