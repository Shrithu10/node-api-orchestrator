import pytest

from app.core.dag import topological_sort_levels
from app.core.exceptions import CyclicDependencyError, InvalidDAGError
from app.schemas.workflow import EdgeSchema, NodeSchema


def _node(node_id: str) -> NodeSchema:
    return NodeSchema(id=node_id, type="noop", label=node_id, config={})


def _edge(src: str, tgt: str) -> EdgeSchema:
    return EdgeSchema(source=src, target=tgt)


class TestTopologicalSort:
    def test_single_node_no_edges(self):
        levels = topological_sort_levels([_node("a")], [])
        assert levels == [["a"]]

    def test_linear_chain(self):
        nodes = [_node("a"), _node("b"), _node("c")]
        edges = [_edge("a", "b"), _edge("b", "c")]
        levels = topological_sort_levels(nodes, edges)
        assert levels == [["a"], ["b"], ["c"]]

    def test_all_parallel(self):
        nodes = [_node("a"), _node("b"), _node("c")]
        levels = topological_sort_levels(nodes, [])
        assert len(levels) == 1
        assert set(levels[0]) == {"a", "b", "c"}

    def test_diamond_dag(self):
        nodes = [_node("a"), _node("b"), _node("c"), _node("d")]
        edges = [_edge("a", "b"), _edge("a", "c"), _edge("b", "d"), _edge("c", "d")]
        levels = topological_sort_levels(nodes, edges)
        assert levels[0] == ["a"]
        assert set(levels[1]) == {"b", "c"}
        assert levels[2] == ["d"]

    def test_complex_multi_level(self):
        nodes = [_node(str(i)) for i in range(6)]
        edges = [
            _edge("0", "2"), _edge("0", "3"),
            _edge("1", "3"), _edge("1", "4"),
            _edge("2", "5"), _edge("3", "5"), _edge("4", "5"),
        ]
        levels = topological_sort_levels(nodes, edges)
        assert set(levels[0]) == {"0", "1"}
        assert set(levels[1]) == {"2", "3", "4"}
        assert levels[2] == ["5"]

    def test_cycle_three_nodes(self):
        nodes = [_node("a"), _node("b"), _node("c")]
        edges = [_edge("a", "b"), _edge("b", "c"), _edge("c", "a")]
        with pytest.raises(CyclicDependencyError):
            topological_sort_levels(nodes, edges)

    def test_cycle_two_nodes(self):
        nodes = [_node("x"), _node("y")]
        edges = [_edge("x", "y"), _edge("y", "x")]
        with pytest.raises(CyclicDependencyError):
            topological_sort_levels(nodes, edges)

    def test_self_loop(self):
        nodes = [_node("a")]
        edges = [_edge("a", "a")]
        with pytest.raises(InvalidDAGError, match="Self-loop"):
            topological_sort_levels(nodes, edges)

    def test_unknown_source_node(self):
        nodes = [_node("a")]
        edges = [_edge("ghost", "a")]
        with pytest.raises(InvalidDAGError, match="source"):
            topological_sort_levels(nodes, edges)

    def test_unknown_target_node(self):
        nodes = [_node("a")]
        edges = [_edge("a", "ghost")]
        with pytest.raises(InvalidDAGError, match="target"):
            topological_sort_levels(nodes, edges)

    def test_wide_fan_out(self):
        nodes = [_node("root")] + [_node(f"leaf_{i}") for i in range(10)]
        edges = [_edge("root", f"leaf_{i}") for i in range(10)]
        levels = topological_sort_levels(nodes, edges)
        assert levels[0] == ["root"]
        assert len(levels[1]) == 10

    def test_wide_fan_in(self):
        nodes = [_node(f"src_{i}") for i in range(5)] + [_node("sink")]
        edges = [_edge(f"src_{i}", "sink") for i in range(5)]
        levels = topological_sort_levels(nodes, edges)
        assert set(levels[0]) == {f"src_{i}" for i in range(5)}
        assert levels[1] == ["sink"]

    def test_disconnected_subgraphs(self):
        nodes = [_node("a"), _node("b"), _node("c"), _node("d")]
        edges = [_edge("a", "b"), _edge("c", "d")]
        levels = topological_sort_levels(nodes, edges)
        all_nodes = {nid for level in levels for nid in level}
        assert all_nodes == {"a", "b", "c", "d"}
        for level in levels:
            for nid in level:
                if nid in ("b", "d"):
                    parent = "a" if nid == "b" else "c"
                    parent_level = next(
                        i for i, lvl in enumerate(levels) if parent in lvl
                    )
                    current_level = next(
                        i for i, lvl in enumerate(levels) if nid in lvl
                    )
                    assert parent_level < current_level
