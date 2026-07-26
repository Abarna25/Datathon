import pandas as pd
from catalyst_client import get_catalyst_app
from utils import setup_logger, PipelineException
from config import MERGE_ON

logger = setup_logger("datastore_loader")

SYSTEM_COLUMNS = ['ROWID', 'CREATORID', 'CREATEDTIME', 'MODIFIEDTIME']

def fetch_table_data(app, table_name: str) -> pd.DataFrame:
    """
    Fetches all records from a given Zoho Catalyst Data Store table,
    handling pagination automatically.
    """
    try:
        datastore = app.datastore()
        table = datastore.table(table_name)
        
        all_records = []
        next_token = None
        
        logger.info(f"Fetching data from table: {table_name}")
        
        while True:
            if next_token:
                response = table.get_paged_records(next_token=next_token)
            else:
                response = table.get_paged_records()
                
            records = response.get_data()
            if not records:
                break
                
            # Extract column data
            for record in records:
                row_data = {}
                for key, value in record.items():
                    # Ignore system-generated columns unless specifically needed
                    if key not in SYSTEM_COLUMNS:
                        row_data[key] = value
                all_records.append(row_data)
                
            next_token = response.get_next_token()
            if not next_token:
                break
                
        df = pd.DataFrame(all_records)
        logger.info(f"Successfully fetched {len(df)} records from {table_name}")
        return df
    
    except Exception as e:
        logger.error(f"Error fetching data from table {table_name}: {str(e)}")
        raise PipelineException(f"Error fetching data from table {table_name}: {str(e)}")

def load_all_datasets(table_names: list) -> dict:
    """
    Loads all datasets for the given list of table names.
    Returns a dictionary mapping table name to its DataFrame.
    """
    app = get_catalyst_app()
    datasets = {}
    
    for table_name in table_names:
        df = fetch_table_data(app, table_name)
        if not df.empty:
            datasets[table_name] = df
        else:
            logger.warning(f"Table {table_name} is empty or could not be loaded.")
            
    return datasets

def merge_datasets(datasets: dict) -> pd.DataFrame:
    """
    Merges multiple datasets if a MERGE_ON column is specified and exists.
    Otherwise, returns the first non-empty dataset.
    """
    if not datasets:
        raise PipelineException("No datasets provided for merging.")
        
    table_names = list(datasets.keys())
    
    if len(datasets) == 1:
        logger.info("Only one dataset loaded. No merging required.")
        return datasets[table_names[0]]
        
    if MERGE_ON:
        logger.info(f"Attempting to merge datasets on column: {MERGE_ON}")
        merged_df = datasets[table_names[0]]
        for name in table_names[1:]:
            df_to_merge = datasets[name]
            if MERGE_ON in merged_df.columns and MERGE_ON in df_to_merge.columns:
                # Use outer join to keep all data, can be changed to inner if required
                merged_df = pd.merge(merged_df, df_to_merge, on=MERGE_ON, how='outer')
            else:
                logger.warning(f"Merge column '{MERGE_ON}' not found in either {table_names[0]} or {name}. Skipping merge for {name}.")
        
        logger.info(f"Merge complete. Final shape: {merged_df.shape}")
        return merged_df
    else:
        logger.warning("Multiple datasets found but MERGE_ON is not configured. Returning the first dataset.")
        return datasets[table_names[0]]

def load_and_merge_data(table_names: list) -> pd.DataFrame:
    """
    End-to-end function to load multiple tables and merge them.
    """
    datasets = load_all_datasets(table_names)
    merged_df = merge_datasets(datasets)
    return merged_df
