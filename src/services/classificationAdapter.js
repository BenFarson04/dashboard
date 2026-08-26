// AI-ready boundary. A future server-side adapter may enrich these records, but
// deterministic classification remains the default and never needs a secret.
export function createClassificationAdapter({ enrich = null } = {}) {
  return {
    method: enrich ? 'deterministic-plus-server-enrichment' : 'deterministic',
    async classify(article, interests, deterministicClassifier) {
      const base = deterministicClassifier(article, interests)
      return enrich ? enrich(base) : base
    },
  }
}
