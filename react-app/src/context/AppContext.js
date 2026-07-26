import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const { user } = useAuth();
    const [officer, setOfficer] = useState({ name: '', role: '', id: null });
    
    const [cases, setCases] = useState([]);
    const [activeCaseId, setActiveCaseIdState] = useState(null);
    const [currentCase, setCurrentCase] = useState(null);
    const [loadingCases, setLoadingCases] = useState(true);

    useEffect(() => {
        if (user) {
            setOfficer({
                name: user.name || 'Officer',
                role: user.email || 'Investigator',
                id: user.id
            });
        } else {
            setOfficer({ name: '', role: '', id: null });
        }
    }, [user]);

    // Fetch cases and initialize active case
    useEffect(() => {
        const loadCases = async () => {
            try {
                setLoadingCases(true);
                const res = await api.get('/cases');
                const caseList = res.data.data || [];
                setCases(caseList);

                if (caseList.length > 0) {
                    const savedId = localStorage.getItem('vikshana_active_case_id');
                    const exists = caseList.some(c => String(c.id) === String(savedId));
                    const initialId = exists ? savedId : caseList[0].id;
                    
                    setActiveCaseIdState(initialId);
                    localStorage.setItem('vikshana_active_case_id', initialId);
                }
            } catch (err) {
                console.debug('[AppContext] Failed to load cases:', err);
            } finally {
                setLoadingCases(false);
            }
        };
        loadCases();
    }, []);

    // Load full bundle when active case changes
    useEffect(() => {
        if (!activeCaseId) return;
        
        if (activeCaseId === 'all') {
            setCurrentCase({ category: 'Global Search', caseId: 'all' });
            return;
        }
        
        const fetchBundle = async () => {
            try {
                const res = await api.get(`/cases/${activeCaseId}/full-bundle`);
                if (res.data?.success) {
                    setCurrentCase(res.data.data);
                }
            } catch (err) {
                console.debug('[AppContext] Failed to load case bundle:', err);
                // Fallback to simple matching case from list
                const matchingCase = cases.find(c => String(c.id) === String(activeCaseId));
                if (matchingCase) {
                    setCurrentCase({
                        caseId: matchingCase.id,
                        caseNumber: matchingCase.caseNumber,
                        category: matchingCase.category,
                        location: matchingCase.location,
                        date: matchingCase.date,
                        policeStation: matchingCase.policeStation,
                        officer: matchingCase.officer
                    });
                }
            }
        };
        fetchBundle();
    }, [activeCaseId, cases]);

    const setActiveCaseId = useCallback((id) => {
        setActiveCaseIdState(id);
        localStorage.setItem('vikshana_active_case_id', id);
    }, []);

    const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <AppContext.Provider value={{ 
            theme, toggleTheme, officer, setOfficer, 
            cases, activeCaseId, setActiveCaseId,
            currentCase, setCurrentCase, loadingCases
        }}>
            <div className={`app-container ${theme}-theme`}>
                {children}
            </div>
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
