from .ipymovehub import (
    MAX_ANGLE,
    MAX_POWER,
    MAX_SECONDS,
    MIN_POWER,
    LedColor,
    MoveHubWidget,
    Port,
    Sensor,
    TaskFailedError,
)
try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'ipymovehub' outside a proper installation.")
    __version__ = "dev"


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyter-movehub"
    }]