from collections import defaultdict, deque

from app.core.exceptions import CyclicDependencyError, InvalidDAGError
from app.schemas.workflow import EdgeSchema, NodeSchema


def _build_graph(
    nodes: list[NodeSchema], edges: list[EdgeSchema]
) -> tuple[dict[str, list[str]], dict[str, int]]:
    node_ids: set[str] = {node.id for node in nodes}

    for edge in edges:
        if edge.source not in node_ids:
            raise InvalidDAGError(
                f"Edge references unknown source node: {edge.source!r}"
            )
        if edge.target not in node_ids:
            raise InvalidDAGError(
                f"Edge references unknown target node: {edge.target!r}"
            )
        if edge.source == edge.target:
            raise InvalidDAGError(f"Self-loop detected on node: {edge.source!r}")

    adjacency: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {node.id: 0 for node in nodes}

    for edge in edges:
        adjacency[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    return dict(adjacency), in_degree


def topological_sort_levels(
    nodes: list[NodeSchema], edges: list[EdgeSchema]
) -> list[list[str]]:
    adjacency, in_degree = _build_graph(nodes, edges)

    queue: deque[str] = deque(
        node_id for node_id, degree in in_degree.items() if degree == 0
    )
    levels: list[list[str]] = []
    processed: int = 0

    while queue:
        level_size = len(queue)
        current_level: list[str] = []

        for _ in range(level_size):
            node_id = queue.popleft()
            current_level.append(node_id)
            processed += 1

            for neighbor in adjacency.get(node_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        levels.append(current_level)

    if processed != len(nodes):
        raise CyclicDependencyError(
            f"Cycle detected: only {processed}/{len(nodes)} nodes reachable via topological sort"
        )

    return levels
