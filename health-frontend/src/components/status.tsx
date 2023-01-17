import React from 'react';
import { EState } from '../interfaces/IHealth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faSmile } from '@fortawesome/free-solid-svg-icons'
import { faFrown } from '@fortawesome/free-solid-svg-icons'
import { faHourglass } from '@fortawesome/free-solid-svg-icons'
import { faPlugCircleXmark } from '@fortawesome/free-solid-svg-icons'
import './status.css';

interface IProps {
    state: EState,
    text?: string
}

export function OnlineState(props: IProps) {
    var icon = <FontAwesomeIcon icon={faSmile} />;
    var state = "online"

    if (props.state === EState.Loading) {
        icon = <FontAwesomeIcon icon={faHourglass} />;
        state = "loading"
    }

    if (props.state === EState.Offline) {
        icon = <FontAwesomeIcon icon={faFrown} />;
        state = "offline"
    }

    if (props.state === EState.Unreachable) {
        icon = <FontAwesomeIcon icon={faPlugCircleXmark} />;
        state = "unreachable"
    }

    return (
        <span className={`status status-${state}`}
            title={props.text}
        >
            {icon}
        </span>
    );
}