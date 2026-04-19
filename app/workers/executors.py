import abc
import time
from typing import Any

import httpx


class NodeExecutor(abc.ABC):
    @abc.abstractmethod
    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        ...


class HttpRequestExecutor(NodeExecutor):
    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        url: str = config["url"]
        method: str = config.get("method", "GET").upper()
        headers: dict = config.get("headers", {})
        body: Any = config.get("body")
        params: dict = config.get("params", {})
        timeout: int = min(int(config.get("timeout", 30)), 120)

        with httpx.Client(timeout=timeout) as client:
            response = client.request(
                method, url, headers=headers, json=body, params=params
            )
            response.raise_for_status()

            try:
                data = response.json()
            except Exception:
                data = {"text": response.text}

            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": data,
            }


class TransformExecutor(NodeExecutor):
    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        source_node: str | None = config.get("source_node")
        mappings: dict[str, str] = config.get("mappings", {})

        source_data = upstream.get(source_node, {}) if source_node else {}
        result: dict[str, Any] = {}

        for output_key, dot_path in mappings.items():
            parts = dot_path.split(".")
            value: Any = source_data
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = None
                    break
            result[output_key] = value

        return result


class FilterExecutor(NodeExecutor):
    _OPS = {
        "eq": lambda a, b: a == b,
        "ne": lambda a, b: a != b,
        "gt": lambda a, b: a > b,
        "gte": lambda a, b: a >= b,
        "lt": lambda a, b: a < b,
        "lte": lambda a, b: a <= b,
        "contains": lambda a, b: b in str(a),
        "startswith": lambda a, b: str(a).startswith(str(b)),
    }

    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        source_node: str | None = config.get("source_node")
        field: str = config.get("field", "")
        operator: str = config.get("operator", "eq")
        value: Any = config.get("value")

        source_data = upstream.get(source_node, {}) if source_node else {}
        field_value = source_data.get(field)

        op_fn = self._OPS.get(operator, self._OPS["eq"])
        passed: bool = op_fn(field_value, value)

        return {"passed": passed, "data": source_data if passed else None}


class MergeExecutor(NodeExecutor):
    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        strategy: str = config.get("strategy", "shallow")
        result: dict[str, Any] = {}

        for node_output in upstream.values():
            if isinstance(node_output, dict):
                if strategy == "shallow":
                    result.update(node_output)
                else:
                    result = _deep_merge(result, node_output)

        return result


def _deep_merge(base: dict, override: dict) -> dict:
    result = dict(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


class DelayExecutor(NodeExecutor):
    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        seconds: float = min(float(config.get("seconds", 1)), 300)
        time.sleep(seconds)
        return {"delayed_seconds": seconds}


class NoopExecutor(NodeExecutor):
    def execute(
        self, config: dict[str, Any], upstream: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        return {"noop": True, "config": config, "upstream_keys": list(upstream.keys())}


class ExecutorRegistry:
    def __init__(self) -> None:
        self._registry: dict[str, NodeExecutor] = {}

    def register(self, node_type: str, executor: NodeExecutor) -> None:
        self._registry[node_type] = executor

    def get(self, node_type: str) -> NodeExecutor | None:
        return self._registry.get(node_type)

    def registered_types(self) -> list[str]:
        return list(self._registry.keys())


executor_registry = ExecutorRegistry()
executor_registry.register("http_request", HttpRequestExecutor())
executor_registry.register("transform", TransformExecutor())
executor_registry.register("filter", FilterExecutor())
executor_registry.register("merge", MergeExecutor())
executor_registry.register("delay", DelayExecutor())
executor_registry.register("noop", NoopExecutor())
