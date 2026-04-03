import React from "react";

// ClauseList component - List of all analyzed clauses
export function ClauseList({ clauses }: { clauses: any[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-black uppercase text-foreground">Analyzed Clauses</h3>
      <div className="space-y-4">
        {clauses.map((clause) => (
          <div key={clause.id} className="card-impact p-4 border-2 border-foreground">
            <h4 className="text-lg font-bold text-foreground">Clause {clause.id}</h4>
            <p className="text-muted-foreground font-medium mt-2">{clause.text}</p>
            <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold uppercase rounded-none border-2 ${
                clause.riskLevel === 'safe' ? 'border-green-600 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300' 
                : clause.riskLevel === 'warning' ? 'border-yellow-600 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300' 
                : clause.riskLevel === 'dangerous' ? 'border-red-600 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300' 
                : 'border-purple-600 text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300'
              }`}
            >
              {clause.riskLevel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
