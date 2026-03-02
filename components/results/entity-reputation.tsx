// EntityReputation component - Shows reputation of mentioned entities
export function EntityReputation({ entities }: { entities: any[] }) {
  return (
    <div className="entity-reputation">
      <h3>Entity Reputation</h3>
      <div className="entities-list">
        {entities.map((entity) => (
          <div key={entity.id} className="entity-item">
            <h4>{entity.name}</h4>
            <p className={`reputation-score ${entity.reputation}`}>
              Reputation: {entity.reputation}
            </p>
            <p>{entity.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
