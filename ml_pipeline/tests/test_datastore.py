import pytest
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from preprocessing import handle_missing_values

def test_handle_missing_values():
    df = pd.DataFrame({
        'A': [1, 2, None, 4],
        'B': ['x', 'y', None, 'x']
    })
    
    df_clean = handle_missing_values(df)
    
    assert df_clean['A'].isnull().sum() == 0
    # Median of [1, 2, 4] is 2
    assert df_clean['A'].iloc[2] == 2.0
    
    assert df_clean['B'].isnull().sum() == 0
    # Mode of ['x', 'y', 'x'] is 'x'
    assert df_clean['B'].iloc[2] == 'x'

# Note: In a real environment, you would mock the Catalyst SDK 
# to test datastore loading and file store uploads without making actual API calls.
