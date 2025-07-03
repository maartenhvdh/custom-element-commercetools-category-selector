import { useState, useEffect } from 'react';
import { useConfig, useIsDisabled, useValue } from './customElement/CustomElementContext';
import { getCommercetoolsToken, fetchCommercetoolsCategories } from './customElement/commercetoolsClient';

export const IntegrationApp = () => {
  // use this to access/modify this element's value
  const [elementValue, setElementValue] = useValue();
  // get whether this element should be disabled
  const isDisabled = useIsDisabled();
  // this custom element's configuration (defined in the content type in the Kontent.ai app)
  const config = useConfig();

  // commercetools category selector state
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // selected category IDs (from elementValue)
  const selectedCategoryIds = Array.isArray(elementValue) ? elementValue : [];

  useEffect(() => {
    setLoadingCategories(true);
    setCategoriesError(null);
    getCommercetoolsToken(config)
      .then(token => fetchCommercetoolsCategories(token, config))
      .then(cats => setCategories(cats))
      .catch(e => setCategoriesError(e.message))
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setElementValue({ valueKey: selected[0] || '' }); // Pass object with valueKey property
  };

  return (
    <div>
      <h2>Commercetools Category Selector</h2>
      {loadingCategories && <div>Loading categories...</div>}
      {categoriesError && <div style={{ color: 'red' }}>Error: {categoriesError}</div>}
      {!loadingCategories && !categoriesError && (
        <select
          multiple
          disabled={isDisabled}
          value={selectedCategoryIds}
          onChange={handleCategoryChange}
          style={{ minWidth: 300, minHeight: 120 }}
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name?.en || cat.key || cat.id}
            </option>
          ))}
        </select>
      )}
      <div style={{ marginTop: 8 }}>
        <strong>Selected category IDs:</strong> {selectedCategoryIds.join(', ')}
      </div>
    </div>
  );
};

IntegrationApp.displayName = 'IntegrationApp';
