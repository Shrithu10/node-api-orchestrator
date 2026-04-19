class OrchestratorError(Exception):
    pass


class CyclicDependencyError(OrchestratorError):
    pass


class InvalidDAGError(OrchestratorError):
    pass


class WorkflowNotFoundError(OrchestratorError):
    pass


class WorkflowRunNotFoundError(OrchestratorError):
    pass
