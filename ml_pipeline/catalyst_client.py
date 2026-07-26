import zcatalyst_sdk
from zcatalyst_sdk.catalyst_app import CatalystApp
from config import PROJECT_ID, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, ENVIRONMENT
from utils import setup_logger, PipelineException

logger = setup_logger("catalyst_client")

def get_catalyst_app() -> CatalystApp:
    """
    Initializes and returns a Catalyst application instance.
    Uses environment variables for authentication.
    """
    try:
        # Note: If running inside a Catalyst function, zcatalyst_sdk.initialize() without args
        # might be sufficient. Here we configure it for both external and internal use.
        if all([PROJECT_ID, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN]):
            app = zcatalyst_sdk.initialize(
                project_id=PROJECT_ID,
                client_id=CLIENT_ID,
                client_secret=CLIENT_SECRET,
                refresh_token=REFRESH_TOKEN,
                environment=ENVIRONMENT
            )
            logger.info("Catalyst SDK initialized successfully using credentials.")
        else:
            app = zcatalyst_sdk.initialize()
            logger.info("Catalyst SDK initialized successfully using default environment.")
        return app
    except Exception as e:
        logger.error(f"Failed to initialize Catalyst SDK: {str(e)}")
        raise PipelineException(f"Failed to initialize Catalyst SDK: {str(e)}")
