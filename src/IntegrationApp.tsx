import { useState, useEffect } from 'react';
import { useConfig, useIsDisabled, useValue } from './customElement/CustomElementContext';
import { getCommercetoolsToken, fetchCommercetoolsCategories } from './customElement/commercetoolsClient';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import 'react-dropdown-tree-select/dist/styles.css';

// Category type
interface Category {
  id: string;
  key?: string;
  name?: { [lang: string]: string };
  parent?: { typeId: string; id: string };
  children?: Category[];
  [key: string]: any;
}

// Transform categories to tree format for react-dropdown-tree-select
function buildCategoryTree(categories: Category[]): any[] {
  const map: { [id: string]: any } = {};
  categories.forEach((cat: Category) => {
    map[cat.id] = {
      label: cat.name?.['en-US'] || cat.key || cat.id,
      value: cat.id,
      children: [],
      ...cat,
    };
  });
  const roots: any[] = [];
  categories.forEach((cat: Category) => {
    if (
      cat.parent &&
      cat.parent.id &&
      map[cat.parent.id] !== undefined &&
      map[cat.id] !== undefined
    ) {
      map[cat.parent.id].children.push(map[cat.id]);
    } else if (map[cat.id] !== undefined) {
      roots.push(map[cat.id]);
    }
  });
  return roots.filter(Boolean);
}

export const IntegrationApp = () => {
  // elementValue is always a string[] (array of category IDs)
  const [elementValue, setElementValue] = useValue();
  const isDisabled = useIsDisabled();
  const config = useConfig();

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<any[]>([]);

  // selected category IDs (from elementValue)
  const selectedCategoryIds: string[] = Array.isArray(elementValue) ? elementValue : [];

  useEffect(() => {
    setLoadingCategories(true);
    setCategoriesError(null);
    getCommercetoolsToken(config)
      .then((token: string) => fetchCommercetoolsCategories(token, config))
      .then((cats: Category[]) => {
        const tree = buildCategoryTree(cats);
        setTreeData(tree);
      })
      .catch((e: Error) => setCategoriesError(e.message))
      .finally(() => setLoadingCategories(false));
  }, []);

  // react-dropdown-tree-select expects a specific format for selected values
  // We'll use the onChange handler to update our selected IDs
  const handleTreeChange = (_currentNode: any, selectedNodes: any[]) => {
    setElementValue(selectedNodes.map(node => node.value));
  };

  // Preselect nodes by marking them as checked in the tree data
  function markCheckedNodes(nodes: any[]): any[] {
    return nodes.map(node => {
      const checked = selectedCategoryIds.includes(node.value);
      return {
        ...node,
        checked,
        children: node.children ? markCheckedNodes(node.children) : [],
      };
    });
  }

  return (
    <div>
      <h2>Commercetools Category Selector</h2>
      {loadingCategories && <div>Loading categories...</div>}
      {categoriesError && <div style={{ color: 'red' }}>Error: {categoriesError}</div>}
      {!loadingCategories && !categoriesError && (
        <DropdownTreeSelect
          data={markCheckedNodes(treeData)}
          onChange={handleTreeChange}
          mode="multiSelect"
          texts={{ placeholder: 'Select categories...' }}
          disabled={isDisabled}
        />
      )}
      <div style={{ marginTop: 8 }}>
        <strong>Selected category IDs:</strong> {selectedCategoryIds.join(', ')}
      </div>
    </div>
  );
};

IntegrationApp.displayName = 'IntegrationApp';
