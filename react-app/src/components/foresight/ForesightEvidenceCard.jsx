import React from 'react';
import { Database, Link2, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export default function ForesightEvidenceCard({ evidence = [] }) {
    if (!evidence || evidence.length === 0) {
        return (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-sm">
                No grounded historical evidence records attached.
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'PRIOR_CASE_HISTORY':
            case 'HISTORICAL_DOCKET_LINKS':
                return <Database className="w-4 h-4 text-blue-400" />;
            case 'RECIDIVISM_INTERVAL':
                return <Clock className="w-4 h-4 text-amber-400" />;
            case 'GRAVITY_ESCALATION':
                return <AlertTriangle className="w-4 h-4 text-red-400" />;
            case 'MO_PATTERN_CONSISTENCY':
                return <Link2 className="w-4 h-4 text-purple-400" />;
            default:
                return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
        }
    };

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Grounded Historical Evidence Trail
                </h3>
            </div>

            <p className="text-xs text-slate-400 mb-3">
                Every factor shown to the officer is traceable to verified historical records in the Karnataka Police Datastore.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evidence.map((item, index) => (
                    <div
                        key={index}
                        className="bg-slate-850/60 border border-slate-800 hover:border-slate-700 p-3.5 rounded-lg transition-all space-y-1.5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-xs text-slate-200">
                                {getIcon(item.type)}
                                <span>{item.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                                {item.source}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed pl-6">
                            {item.detail}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
