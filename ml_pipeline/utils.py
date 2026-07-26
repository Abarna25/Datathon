import logging
import os
from config import LOG_DIR

def setup_logger(name: str) -> logging.Logger:
    """
    Sets up and returns a logger with both console and file handlers.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Avoid adding handlers multiple times
    if not logger.handlers:
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        # File handler
        log_file = os.path.join(LOG_DIR, f"{name}.log")
        fh = logging.FileHandler(log_file)
        fh.setFormatter(formatter)
        
        # Console handler
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        
        logger.addHandler(fh)
        logger.addHandler(ch)
        
    return logger

class PipelineException(Exception):
    """Custom exception for ML pipeline errors."""
    pass
