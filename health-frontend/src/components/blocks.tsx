import React from 'react';
import { IBlock, IModel } from '../interfaces/IHealth';
import { OnlineState } from './status';
import './blocks.css';

export function Blocks(blocks: IBlock[], model: IModel ) {
    const blockMap = blocks.map(block => Object.assign({}, {[block.block_index]: block}))
        .reduce((map, obj) => Object.assign(map, obj), {})
    const rows = Array.from({ length: model.n_blocks }, (_, i) => i + 1).map((index) => {
        let i = index - 1;
        if (i in blockMap) {
            return (<td className="block-status"><OnlineState state={blockMap[i].state} text={"Block #" + index} /></td>)
        }
        return (<td className="block-status"></td>)
    })
    return rows;
}