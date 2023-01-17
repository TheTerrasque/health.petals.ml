from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from functools import partial
from typing import List, Tuple
import os

import hivemind

from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS, cross_origin
from flask_caching import Cache

from multiaddr import Multiaddr
from petals.constants import PUBLIC_INITIAL_PEERS
from petals.data_structures import ServerState
from petals.dht_utils import get_remote_module_infos

from p2p_utils import check_reachability, check_reachability_parallel


dht = hivemind.DHT(
    initial_peers=PUBLIC_INITIAL_PEERS, client_mode=True, num_workers=32, use_auto_relay=True, start=True
)
app = Flask(__name__)
if os.environ.get("RUN_ENV") == "prod":
    cache = Cache(app, config={'CACHE_TYPE': 'FileSystemCache', "CACHE_DIR": "/tmp/petals-cache"})
else:
    cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

@dataclass
class ModelInfo:
    name: str
    original_name: str
    n_blocks: int


MODELS = [
    ModelInfo("bigscience/bloom-petals", "bigscience/bloom", 70),
    ModelInfo("bigscience/bloomz-petals", "bigscience/bloomz", 70),
]

@dataclass
class ServerInfo:
    friendly_peer_id: str = None
    throughput: float = None
    blocks: List[Tuple[int, ServerState]] = field(default_factory=list)

@app.route("/health.json")
@cross_origin()
@cache.cached(timeout=15)
def health_json():
    bootstrap_peer_ids = []
    for addr in PUBLIC_INITIAL_PEERS:
        peer_id = hivemind.PeerID.from_base58(Multiaddr(addr)["p2p"])
        if peer_id not in bootstrap_peer_ids:
            bootstrap_peer_ids.append(peer_id)

    rpc_infos = dht.run_coroutine(partial(check_reachability_parallel, bootstrap_peer_ids))

    model_reports = []
    for model in MODELS:
        module_infos = get_remote_module_infos(
            dht,
            [f"{model.name}.{i}" for i in range(model.n_blocks)],
            float("inf"),
        )
        servers = defaultdict(ServerInfo)
        n_found_blocks = 0
        for block_idx, info in enumerate(module_infos):
            if info is None:
                continue

            found = False
            for peer_id, server in info.servers.items():
                servers[peer_id].throughput = server.throughput
                servers[peer_id].blocks.append((block_idx, server.state))
                if server.state == ServerState.ONLINE:
                    found = True
            n_found_blocks += found

        all_blocks_found = n_found_blocks == model.n_blocks
        rpc_infos.update(dht.run_coroutine(partial(check_reachability_parallel, list(servers.keys()), fetch_info=True)))
        all_bootstrap_reachable = all(rpc_infos[peer_id]["ok"] for peer_id in bootstrap_peer_ids)
        model_state = "healthy" if all_blocks_found and all_bootstrap_reachable else "broken"
        bootstrap_states = [{"peer": str(peer_id), "online": rpc_infos[peer_id]["ok"]} for peer_id in bootstrap_peer_ids]
        
        server_rows = []
        for peer_id, server_info in sorted(servers.items()):
            block_indices = [block_idx for block_idx, state in server_info.blocks if state != ServerState.OFFLINE]
            block_indices = [min(block_indices), max(block_indices) + 1] if block_indices else []

            block_map = []
            for block_idx, state in server_info.blocks:
                state_name = state.name
                state_val = state.value
                if state == ServerState.ONLINE and not rpc_infos[peer_id]["ok"]:
                    state_name = "UNREACHABLE"
                    state_val = 3
                block_map.append({"block_index": block_idx, "state_text": state_name, "state": state_val})

            row = rpc_infos[peer_id]
            row.update(
                {
                    "short_peer_id": "..." + str(peer_id)[-12:],
                    "peer_id": str(peer_id),
                    "throughput": server_info.throughput,
                    "block_indices": block_indices,
                    "blocks": block_map,
                }
            )
            server_rows.append(row)

        reachability_issues = [
            {"peer_id": str(peer_id), "err": info["error"]}
            for peer_id, info in sorted(rpc_infos.items())
            if not info["ok"]
            and (peer_id not in servers or any(state == ServerState.ONLINE for _, state in servers[peer_id].blocks))
        ]
        model_reports.append({
            "name": model.name,
            "original_name": model.original_name,
            "n_blocks": model.n_blocks,
            "state": model_state,
            "servers": server_rows
        })
    data = {
        "models": model_reports,
        "bootstrap_servers": bootstrap_states,
        "reachability_issues": reachability_issues,
        "updated_at": datetime.now().isoformat(),
    }
    return jsonify(data)

@app.route("/health")
def health():
    bootstrap_peer_ids = []
    for addr in PUBLIC_INITIAL_PEERS:
        peer_id = hivemind.PeerID.from_base58(Multiaddr(addr)["p2p"])
        if peer_id not in bootstrap_peer_ids:
            bootstrap_peer_ids.append(peer_id)

    rpc_infos = dht.run_coroutine(partial(check_reachability_parallel, bootstrap_peer_ids))

    model_reports = []
    for model in MODELS:
        module_infos = get_remote_module_infos(
            dht,
            [f"{model.name}.{i}" for i in range(model.n_blocks)],
            float("inf"),
        )

        servers = defaultdict(ServerInfo)
        n_found_blocks = 0
        for block_idx, info in enumerate(module_infos):
            if info is None:
                continue

            found = False
            for peer_id, server in info.servers.items():
                servers[peer_id].throughput = server.throughput
                servers[peer_id].blocks.append((block_idx, server.state))
                if server.state == ServerState.ONLINE:
                    found = True
            n_found_blocks += found
        all_blocks_found = n_found_blocks == model.n_blocks

        rpc_infos.update(dht.run_coroutine(partial(check_reachability_parallel, list(servers.keys()), fetch_info=True)))

        all_bootstrap_reachable = all(rpc_infos[peer_id]["ok"] for peer_id in bootstrap_peer_ids)
        model_state = "healthy" if all_blocks_found and all_bootstrap_reachable else "broken"
        bootstrap_states = "".join(
            get_state_html("online" if rpc_infos[peer_id]["ok"] else "unreachable") for peer_id in bootstrap_peer_ids
        )

        server_rows = []
        for peer_id, server_info in sorted(servers.items()):
            block_indices = [block_idx for block_idx, state in server_info.blocks if state != ServerState.OFFLINE]
            block_indices = f"{min(block_indices)}:{max(block_indices) + 1}" if block_indices else ""

            block_map = ['<td class="block-map"> </td>' for _ in range(model.n_blocks)]
            for block_idx, state in server_info.blocks:
                state_name = state.name
                if state == ServerState.ONLINE and not rpc_infos[peer_id]["ok"]:
                    state_name = "unreachable"
                block_map[block_idx] = f'<td class="block-map">{get_state_html(state_name)}</td>'
            block_map = "".join(block_map)

            row = rpc_infos[peer_id]
            row.update(
                {
                    "short_peer_id": "..." + str(peer_id)[-12:],
                    "peer_id": peer_id,
                    "throughput": server_info.throughput,
                    "block_indices": block_indices,
                    "block_map": block_map,
                }
            )
            server_rows.append(row)

        model_reports.append({
            "name": model.name,
            "original_name": model.original_name,
            "n_blocks": model.n_blocks,
            "state": model_state,
            "server_rows": server_rows,
        })

    reachability_issues = [
        {"peer_id": peer_id, "err": info["error"]}
        for peer_id, info in sorted(rpc_infos.items())
        if not info["ok"]
        and (peer_id not in servers or any(state == ServerState.ONLINE for _, state in servers[peer_id].blocks))
    ]

    return render_template(
        "health.html",
        bootstrap_states=bootstrap_states,
        model_reports=model_reports,
        reachability_issues=reachability_issues,
    )

@app.route('/')
@app.route('/<path:path>')
def send_static(path="index.html"):
    return send_from_directory('health-frontend/build', path)

@app.route('/static/css/<path:path>')
def send_static2(path):
    return send_from_directory('health-frontend/build/static/css', path)

@app.route('/static/js/<path:path>')
def send_static3(path):
    return send_from_directory('health-frontend/build/static/js', path)

def get_state_html(state_name: str):
    state_name = state_name.lower()
    if state_name == "offline":
        char = "_"
    elif state_name == "unreachable":
        char = "✖"
    else:
        char = "●"
    return f'<span class="{state_name}">{char}</span>'


@app.route("/api/v1/is_reachable/<peer_id>")
def api_v1_is_reachable(peer_id):
    peer_id = hivemind.PeerID.from_base58(peer_id)
    rpc_info = dht.run_coroutine(partial(check_reachability, peer_id, use_cache=False))
    return jsonify(
        success=rpc_info["ok"],
        message=rpc_info.get("error"),
        your_ip=request.remote_addr,
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5990)