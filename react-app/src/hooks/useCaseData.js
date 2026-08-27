import { useAppContext } from '../context/AppContext';

/**
 * useCaseData Hook
 * 
 * Provides centralized access to the case's full bundle data.
 * Instead of components independently firing `/cases/:id/summary` or `/cases/:id/timeline`,
 * they should consume this hook which relies on the single full-bundle loaded by AppContext.
 * 
 * The underlying AppContext fires `GET /cases/:id/full-bundle` and stores it in `currentCase`.
 * Any subsequent identical network calls made via `api.js` are also intercepted and deduplicated.
 */
export function useCaseData() {
    const { 
        currentCase, 
        activeCaseId, 
        loadingCases,
        cases,
        setActiveCaseId
    } = useAppContext();

    return {
        // The active case bundle object (victims, suspects, timeline, etc.)
        bundle: currentCase,
        // Loading state
        loading: loadingCases || (activeCaseId && !currentCase && activeCaseId !== 'all'),
        // Case list & selection
        activeCaseId,
        cases,
        setActiveCaseId,
        // Expose individual common slices for convenience
        caseInfo: currentCase?.case || currentCase,
        victims: currentCase?.victims || [],
        suspects: currentCase?.suspects || [],
        witnesses: currentCase?.witnesses || [],
        timeline: currentCase?.timeline || [],
        evidence: currentCase?.evidence || [],
        financialTransactions: currentCase?.financialTransactions || [],
        phoneRecords: currentCase?.phoneRecords || []
    };
}
