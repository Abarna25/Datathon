#!/usr/bin/env python3
"""
foresight_dataset_builder.py
VIKSHANA 3.0 — Foresight Time-Safe Feature & Target Dataset Builder

Constructs mathematically grounded, time-safe features and target labels
from Karnataka Police Datastore historical records with ZERO temporal leakage.
Ultra-fast single-pass chronological state machine.
"""

import os
import time
import pandas as pd
import numpy as np

DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dataset"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data"))

MO_KEYWORDS = [
    'break', 'door', 'lock', 'window', 'latches',
    'snatch', 'running', 'grab', 'chain',
    'shutter', 'grill', 'wall',
    'deceit', 'fraud', 'impersonat', 'online', 'cyber', 'otp',
    'vehicle', 'bike', 'motorcycle', 'car',
    'gold', 'jewel', 'cash', 'money', 'safe',
    'weapon', 'knife', 'assault', 'threat'
]

def extract_mo_keywords(text):
    if not text or pd.isna(text):
        return set()
    text_lower = str(text).lower()
    return {kw for kw in MO_KEYWORDS if kw in text_lower}

def build_foresight_dataset(observation_window_days=30, sample_limit=None):
    start_time = time.time()
    print(f"[DatasetBuilder] Loading datasets from: {DATASET_DIR}")
    case_path = os.path.join(DATASET_DIR, "CaseMaster.csv")
    accused_path = os.path.join(DATASET_DIR, "Accused.csv")

    df_cases = pd.read_csv(case_path, low_memory=False)
    df_accused = pd.read_csv(accused_path, low_memory=False)

    df_cases['CrimeRegisteredDate'] = pd.to_datetime(df_cases['CrimeRegisteredDate'], errors='coerce')
    df_cases = df_cases.dropna(subset=['CrimeRegisteredDate'])

    # Merge Accused with CaseMaster
    merged = pd.merge(
        df_accused[['AccusedMasterID', 'CaseMasterID', 'AccusedName', 'AgeYear', 'GenderID']],
        df_cases[['CaseMasterID', 'CrimeNo', 'CrimeRegisteredDate', 'GravityOffenceID', 'CrimeMajorHeadID', 'PoliceStationID', 'BriefFacts']],
        on='CaseMasterID',
        how='inner'
    )

    merged = merged.dropna(subset=['AccusedName', 'CrimeRegisteredDate'])
    merged['AccusedName'] = merged['AccusedName'].str.strip()
    merged = merged.sort_values(by=['AccusedName', 'CrimeRegisteredDate']).reset_index(drop=True)

    max_date = merged['CrimeRegisteredDate'].max()
    cutoff_date = max_date - pd.Timedelta(days=observation_window_days)
    print(f"[DatasetBuilder] Dataset span: {merged['CrimeRegisteredDate'].min()} to {max_date}")
    print(f"[DatasetBuilder] Observation cutoff for training labels: {cutoff_date}")

    records = []
    grouped = merged.groupby('AccusedName')

    for name, group in grouped:
        group_rows = group.to_dict('records')
        n_cases = len(group_rows)
        
        # State tracking for this individual
        prior_dates = []
        prior_heinous_count = 0
        prior_crime_heads = set()
        prior_locations = set()
        prior_mo_all = set()
        intervals_sum = 0
        intervals_count = 0

        # Precompute MO keywords for the group
        for row in group_rows:
            row['mo_set'] = extract_mo_keywords(row.get('BriefFacts', ''))

        left_90 = 0
        left_180 = 0

        for i, current in enumerate(group_rows):
            current_date = current['CrimeRegisteredDate']
            prior_count = i

            # Sliding window for 90d and 180d
            date_90d_ago = current_date - pd.Timedelta(days=90)
            date_180d_ago = current_date - pd.Timedelta(days=180)

            while left_90 < prior_count and prior_dates[left_90] < date_90d_ago:
                left_90 += 1
            while left_180 < prior_count and prior_dates[left_180] < date_180d_ago:
                left_180 += 1

            prior_90d = prior_count - left_90
            prior_180d = prior_count - left_180

            # Days since previous case
            if prior_count > 0:
                prev_date = prior_dates[-1]
                days_since_prev = max(0, (current_date - prev_date).days)
            else:
                days_since_prev = 365.0

            # Gravity features
            current_heinous = 1 if current.get('GravityOffenceID') == 1 else 0
            prior_heinous_ratio = float(prior_heinous_count / prior_count) if prior_count > 0 else 0.0
            gravity_escalation_flag = 1 if (current_heinous == 1 and prior_heinous_ratio < 0.5) else 0

            # Cadence & intervals
            if intervals_count > 0:
                mean_inter_days = float(intervals_sum / intervals_count)
                cadence_accel = float(days_since_prev / max(1.0, mean_inter_days))
            else:
                mean_inter_days = float(days_since_prev)
                cadence_accel = 1.0

            # Offence diversity
            distinct_heads = len(prior_crime_heads)
            curr_head = current.get('CrimeMajorHeadID')
            repeated_offence = 1 if (pd.notna(curr_head) and curr_head in prior_crime_heads) else 0

            # MO consistency
            current_mo = current['mo_set']
            if prior_count > 0 and len(current_mo) > 0:
                common_mo = len(current_mo.intersection(prior_mo_all))
                mo_consistency = float(common_mo / max(1, len(current_mo)))
            else:
                mo_consistency = 0.0

            # Geographic diversity
            loc_count = len(prior_locations)

            # Target Label construction (Is there any subsequent case within observation window?)
            # Since group_rows is sorted by date, checking the immediate next case group_rows[i+1] is sufficient
            if current_date <= cutoff_date:
                if i + 1 < n_cases:
                    next_date = group_rows[i+1]['CrimeRegisteredDate']
                    label = 1 if ((next_date - current_date).days <= observation_window_days) else 0
                else:
                    label = 0
                is_evaluable = 1
            else:
                label = -1
                is_evaluable = 0

            records.append({
                'AccusedMasterID': current['AccusedMasterID'],
                'CaseMasterID': current['CaseMasterID'],
                'CrimeNo': current.get('CrimeNo', ''),
                'AccusedName': current['AccusedName'],
                'AgeYear': current.get('AgeYear', 30),
                'GenderID': current.get('GenderID', 1),
                'CrimeRegisteredDate': current_date.strftime('%Y-%m-%d'),
                
                # 14 Time-Safe ML Features
                'prior_case_count': prior_count,
                'prior_cases_last_90d': prior_90d,
                'prior_cases_last_180d': prior_180d,
                'days_since_prev_case': days_since_prev,
                'current_case_heinous': current_heinous,
                'prior_heinous_count': prior_heinous_count,
                'prior_heinous_ratio': round(prior_heinous_ratio, 4),
                'gravity_escalation_flag': gravity_escalation_flag,
                'mean_inter_case_days': round(mean_inter_days, 2),
                'cadence_acceleration': round(cadence_accel, 4),
                'distinct_crime_heads': distinct_heads,
                'repeated_offence_type': repeated_offence,
                'mo_consistency_score': round(mo_consistency, 4),
                'recurring_location_count': loc_count,
                
                # Target & Filter Metadata
                'target_label': label,
                'is_evaluable': is_evaluable
            })

            # Update running state for next iteration
            if prior_count > 0:
                intervals_sum += max(1, (current_date - prior_dates[-1]).days)
                intervals_count += 1
            prior_dates.append(current_date)
            if current_heinous == 1:
                prior_heinous_count += 1
            if pd.notna(curr_head):
                prior_crime_heads.add(curr_head)
            if pd.notna(current.get('PoliceStationID')):
                prior_locations.add(current.get('PoliceStationID'))
            if len(current_mo) > 0:
                prior_mo_all.update(current_mo)

            if sample_limit and len(records) >= sample_limit:
                break
        if sample_limit and len(records) >= sample_limit:
            break

    df_result = pd.DataFrame(records)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_file = os.path.join(OUTPUT_DIR, "foresight_features.csv")
    df_result.to_csv(out_file, index=False)
    
    eval_df = df_result[df_result['is_evaluable'] == 1]
    pos_count = (eval_df['target_label'] == 1).sum()
    total_eval = len(eval_df)
    elapsed = time.time() - start_time
    
    print(f"[DatasetBuilder] Built {len(df_result)} feature records in {elapsed:.2f}s.")
    print(f"[DatasetBuilder] Evaluable training samples: {total_eval} (Positives: {pos_count}, {pos_count/total_eval*100:.2f}%)")
    print(f"[DatasetBuilder] Saved to: {out_file}")
    
    return df_result

if __name__ == "__main__":
    build_foresight_dataset()
