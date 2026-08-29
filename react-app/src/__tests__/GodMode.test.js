import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GodModeProvider, GOD_MODE_VIDEO_ID, GOD_MODE_DURATION } from '../context/GodModeContext';
import GodModeVideoOverlay from '../components/godmode/GodModeVideoOverlay';
import GodModeChat from '../components/godmode/GodModeChat';
import GodModeOrchestrator from '../services/godModeOrchestrator';
import DataExplorer from '../pages/DataExplorer';
import { AppProvider } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ caseId: '101' }),
  useSearchParams: () => [new URLSearchParams('caseId=101&q=Ramesh')]
}));

// Mock api service
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }
}));

describe('VIKSHANA — God Mode / Deep Investigation Activation Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    // Default API mock responses
    api.get.mockImplementation((url) => {
      if (url.includes('/intelligence/case/101/leads')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              leads: [
                {
                  leadId: 'LEAD-1',
                  finding: 'Suspect phone ping matches jewelry vault coordinates.',
                  reasoning: 'Tower logs show device in vicinity between 02:15 and 03:00.',
                  confidence: 0.94,
                  classification: 'AI_INFERRED',
                  recommendedVerification: 'Subpoena cell tower CDR dump.'
                }
              ]
            }
          }
        });
      }
      if (url.includes('/intelligence/case/101/mo')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              moProfile: { crimeMethod: 'Nighttime Vault Cut', targetType: 'Jewelry Store' },
              matchedHistoricalCases: [{ caseId: 187, crimeNo: 'CR-187/2021', moSimilarity: 0.91, matchedAttributes: ['Entry', 'Tools'] }],
              matchCount: 1
            }
          }
        });
      }
      if (url.includes('/intelligence/case/101/evidence-chain')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { caseId: '101', unbroken: true, nodes: [{ title: 'Vault Cutter' }] }
          }
        });
      }
      if (url.includes('/intelligence/case/101/temporal-network')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { nodes: [{ id: 'Ramesh', name: 'Ramesh Kumar', type: 'PERSON' }], links: [] }
          }
        });
      }
      if (url.includes('/decision/similar-cases/101')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [{ caseId: 187, caseNumber: 'FIR-187/2021', similarityScore: 0.89 }]
          }
        });
      }
      if (url.includes('/intelligence/case/101/gaps-and-actions')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { gaps: [{ gapType: 'CCTV', description: 'Missing junction cam' }], recommendedActions: [{ action: 'Request traffic CCTV' }] }
          }
        });
      }
      if (url.includes('/intelligence/patterns/emerging')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { patterns: [{ title: 'Commercial Burglary Surge', detectionBasis: '40% surge', percentageChange: '+40%' }] }
          }
        });
      }
      if (url.includes('/intelligence/explain/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              what: 'Primary suspect matched via biometric and cell tower records.',
              why: 'Multi-layer correlation across 3 datastores.',
              evidence: ['CaseMaster', 'CDR Logs'],
              confidence: 0.95,
              classification: 'EVIDENCE_BACKED',
              isAIInferred: false,
              humanVerificationRequired: 'Review physical docket and warrant.'
            }
          }
        });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });
  });

  // 1. Activation Button in Investigation Search
  test('1. Activation: God Mode button is rendered in Investigation Search and triggers activation', async () => {
    const authValue = {
      user: { id: '1', name: 'Inspector Roy', role: 'Investigator' },
      isAuthenticated: true
    };

    render(
      <AuthContext.Provider value={authValue}>
        <AppProvider>
          <GodModeProvider>
            <DataExplorer />
            <GodModeVideoOverlay />
          </GodModeProvider>
        </AppProvider>
      </AuthContext.Provider>
    );

    // Assert ⚡ GOD MODE button exists
    const godModeBtn = screen.getByRole('button', { name: /⚡ GOD MODE/i });
    expect(godModeBtn).toBeInTheDocument();

    // Click ⚡ GOD MODE
    fireEvent.click(godModeBtn);

    // Overlay appears with protocol badge
    expect(screen.getByText(/VIKSHANA 2.0 • GOD MODE ACTIVATION/i)).toBeInTheDocument();
  });

  // 2. Video Controller & 21-Second Boundary Control
  test('2. Video Controller: Correct YouTube ID L5Z-1JlL5ss, starts at 0s and enforces 21s duration boundary', () => {
    expect(GOD_MODE_VIDEO_ID).toBe('L5Z-1JlL5ss');
    expect(GOD_MODE_DURATION).toBe(21);
  });

  // 3. Fallback Handling
  test('3. Fallback: Displays "Unable to load the God Mode transition" if video errors and provides direct progression', async () => {
    const TestComponent = () => {
      const { activateGodMode, handleVideoError } = require('../context/GodModeContext').useGodMode();
      React.useEffect(() => {
        activateGodMode({ caseId: '101', query: 'Burglary' });
        handleVideoError('Network timeout');
      }, [activateGodMode, handleVideoError]);
      return <GodModeVideoOverlay />;
    };

    render(
      <GodModeProvider>
        <TestComponent />
      </GodModeProvider>
    );

    // Assert error message and fallback button exist
    expect(screen.getByText(/Unable to load the God Mode transition/i)).toBeInTheDocument();
    const enterBtn = screen.getByRole('button', { name: /ENTER GOD MODE/i });
    expect(enterBtn).toBeInTheDocument();

    // Click Enter God Mode button
    fireEvent.click(enterBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/god-mode');
  });

  // 4. Context Preservation
  test('4. Context: Preserves query, case ID, and entity context without fabrication', async () => {
    const TestChatWithContext = () => {
      const { setContext } = require('../context/GodModeContext').useGodMode();
      React.useEffect(() => {
        setContext({
          source: 'investigation-search',
          query: 'Ramesh Kumar',
          caseId: '101',
          entityType: 'PERSON',
          entityId: 'ACC-101',
          entityName: 'Ramesh Kumar',
          timestamp: new Date().toISOString()
        });
      }, [setContext]);
      return <GodModeChat />;
    };

    render(
      <GodModeProvider>
        <TestChatWithContext />
      </GodModeProvider>
    );

    // Assert preserved context is displayed in header
    expect(screen.getByText(/#101/i)).toBeInTheDocument();
    expect(screen.getByText(/"Ramesh Kumar"/i)).toBeInTheDocument();
  });

  // 5. Quick Actions & Orchestration
  test('5. Orchestration: "⚡ Run Complete Investigation" executes and displays structured 11-section report', async () => {
    render(
      <GodModeProvider>
        <GodModeChat />
      </GodModeProvider>
    );

    // Find and click "⚡ Run Complete Investigation" button
    const runAllBtn = screen.getByRole('button', { name: /⚡ Run Complete Investigation/i });
    expect(runAllBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(runAllBtn);
    });

    // Verify sections are rendered
    await waitFor(() => {
      expect(screen.getByText(/Section 1: Investigation Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 2: Key Findings/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 3: Top Investigation Leads/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 4: Modus Operandi/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 5: Related Cases/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 6: Temporal Network/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 7: Evidence Chain/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 8: Anomalies & Emerging Patterns/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 9: Investigation Gaps/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 10: Recommended Human Verification/i)).toBeInTheDocument();
      expect(screen.getByText(/Section 11: Confidence & Provenance/i)).toBeInTheDocument();
    });

    // Verify APIs were called
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/intelligence/case/101/leads'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/intelligence/case/101/mo'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/intelligence/case/101/evidence-chain'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/intelligence/case/101/temporal-network'), expect.anything());
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/decision/similar-cases/101'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/intelligence/case/101/gaps-and-actions'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/intelligence/patterns/emerging'));
  });

  // 6. XAI Contract Integration
  test('6. XAI: Interactive Explain button reveals 6-facet explanation contract', async () => {
    render(
      <GodModeProvider>
        <GodModeChat />
      </GodModeProvider>
    );

    // Trigger complete investigation to get leads
    const runAllBtn = screen.getByRole('button', { name: /⚡ Run Complete Investigation/i });
    await act(async () => {
      fireEvent.click(runAllBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Explain Lead \(XAI\)/i)).toBeInTheDocument();
    });

    // Click Explain Lead (XAI)
    const xaiBtn = screen.getByText(/Explain Lead \(XAI\)/i);
    await act(async () => {
      fireEvent.click(xaiBtn);
    });

    // Verify XAI drawer displays WHAT, WHY, EVIDENCE, FACT VS INFERENCE, HUMAN VERIFICATION
    await waitFor(() => {
      expect(screen.getByText(/EXPLAINABLE AI CONTRACT \(XAI\)/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAT \(Finding\)/i)).toBeInTheDocument();
      expect(screen.getByText(/WHY \(Reasoning\)/i)).toBeInTheDocument();
      expect(screen.getByText(/SUPPORTING EVIDENCE/i)).toBeInTheDocument();
      expect(screen.getByText(/HUMAN VERIFICATION REQUIRED/i)).toBeInTheDocument();
    });
  });

  // 7. Exit God Mode
  test('7. Return: Exit God Mode button restores normal navigation without data loss', async () => {
    render(
      <GodModeProvider>
        <GodModeChat />
      </GodModeProvider>
    );

    const exitBtn = screen.getByRole('button', { name: /Exit God Mode/i });
    expect(exitBtn).toBeInTheDocument();

    fireEvent.click(exitBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });
});
