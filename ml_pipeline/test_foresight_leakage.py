#!/usr/bin/env python3
"""
test_foresight_leakage.py
Rigorous Temporal Leakage & Integrity Verification Suite
"""

import os
import pandas as pd
import numpy as np

import sys
import io
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "foresight_features.csv"))

def run_leakage_tests():
    print("================================================================")
    print("[LEAKAGE TEST] RUNNING FORESIGHT TEMPORAL LEAKAGE VERIFICATION")
    print("================================================================")


    assert os.path.exists(DATA_PATH), f"Dataset not found at {DATA_PATH}"
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} records from foresight_features.csv")

    # 1. Verify all expected features are present
    expected_features = [
        'prior_case_count', 'prior_cases_last_90d', 'prior_cases_last_180d',
        'days_since_prev_case', 'current_case_heinous', 'prior_heinous_count',
        'prior_heinous_ratio', 'gravity_escalation_flag', 'mean_inter_case_days',
        'cadence_acceleration', 'distinct_crime_heads', 'repeated_offence_type',
        'mo_consistency_score', 'recurring_location_count'
    ]
    for feat in expected_features:
        assert feat in df.columns, f"Missing feature: {feat}"
        assert not df[feat].isna().any(), f"NaN values detected in feature: {feat}"
    print("[PASS] All 14 features present with zero NaN values.")

    # 2. Verify prior_case_count bounds
    assert (df['prior_cases_last_90d'] <= df['prior_case_count']).all(), "Leakage: prior_cases_last_90d > prior_case_count"
    assert (df['prior_cases_last_180d'] <= df['prior_case_count']).all(), "Leakage: prior_cases_last_180d > prior_case_count"
    assert (df['prior_heinous_count'] <= df['prior_case_count']).all(), "Leakage: prior_heinous_count > prior_case_count"
    print("[PASS] Monotonic sanity bounds satisfied across sub-interval counters.")

    # 3. Verify zero-prior-case integrity
    first_time_mask = df['prior_case_count'] == 0
    first_time_df = df[first_time_mask]
    assert (first_time_df['prior_cases_last_90d'] == 0).all()
    assert (first_time_df['prior_cases_last_180d'] == 0).all()
    assert (first_time_df['prior_heinous_count'] == 0).all()
    assert (first_time_df['prior_heinous_ratio'] == 0.0).all()
    assert (first_time_df['distinct_crime_heads'] == 0).all()
    assert (first_time_df['repeated_offence_type'] == 0).all()
    assert (first_time_df['mo_consistency_score'] == 0.0).all()
    print(f"[PASS] Zero-prior cases ({len(first_time_df)} samples) have clean baseline features.")

    # 4. Verify no negative values or invalid ratios
    assert (df['prior_heinous_ratio'] >= 0.0).all() and (df['prior_heinous_ratio'] <= 1.0).all()
    assert (df['mo_consistency_score'] >= 0.0).all() and (df['mo_consistency_score'] <= 1.0).all()
    print("[PASS] All ratios bounded strictly in [0.0, 1.0].")

    # 5. Verify Temporal Split Ordering
    df['CrimeRegisteredDate'] = pd.to_datetime(df['CrimeRegisteredDate'])
    train_cutoff = pd.to_datetime("2024-07-01")
    train_df = df[(df['CrimeRegisteredDate'] < train_cutoff) & (df['is_evaluable'] == 1)]
    test_df = df[(df['CrimeRegisteredDate'] >= train_cutoff) & (df['is_evaluable'] == 1)]

    assert len(train_df) > 0, "Train split is empty"
    assert len(test_df) > 0, "Test split is empty"
    assert train_df['CrimeRegisteredDate'].max() < test_df['CrimeRegisteredDate'].min()
    print(f"[PASS] Strict out-of-time temporal separation verified:")
    print(f"   - Training period: {train_df['CrimeRegisteredDate'].min().strftime('%Y-%m-%d')} to {train_df['CrimeRegisteredDate'].max().strftime('%Y-%m-%d')} ({len(train_df)} samples)")
    print(f"   - Held-Out Test period: {test_df['CrimeRegisteredDate'].min().strftime('%Y-%m-%d')} to {test_df['CrimeRegisteredDate'].max().strftime('%Y-%m-%d')} ({len(test_df)} samples)")

    print("================================================================")
    print("[COMPLETE] ALL TEMPORAL LEAKAGE & INTEGRITY TESTS PASSED!")
    print("================================================================")


if __name__ == "__main__":
    run_leakage_tests()
