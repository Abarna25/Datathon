import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderSearch, Database, Check } from 'lucide-react';
import * as conversationService from '../../services/conversationService';
import styles from './CasePicker.module.css';

const CasePicker = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadCases = () => {
        setLoading(true);
        conversationService
            .listCases()
            .then(setCases)
            .catch((err) => console.debug('Failed to load cases', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCases();
    }, []);

    return (
        <div className={styles.wrap}>
            <div className={`glass-panel ${styles.card}`}>
                <FolderSearch size={32} color="var(--accent-primary)" />
                <h2>Select a case to investigate</h2>
                <p>Choose an active case to open its persistent AI Investigation Copilot.</p>

                {loading && <div className={styles.hint}>Loading cases...</div>}
                {!loading && cases.length === 0 && <div className={styles.hint}>No cases found in CaseMaster.</div>}

                <div className={styles.list}>
                    {cases.map((c) => {
                        const statusText = (c.status && c.status !== 'Unknown') ? c.status : 'Active Investigation';
                        const locationText = (c.jurisdiction && c.jurisdiction !== 'Unknown') ? c.jurisdiction : 'Sector 18 Precinct';
                        return (
                            <button key={c.id} type="button" className={styles.caseItem} onClick={() => navigate(`/investigate/${c.id}`)}>
                                <span className={styles.caseTitle}>{c.title || `FIR #${c.id}`}</span>
                                <span className={styles.caseMeta}>{statusText} · {locationText}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CasePicker;
