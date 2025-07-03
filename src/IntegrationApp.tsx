// If you haven't already, run:
// npm install @mui/material @mui/lab @mui/icons-material @emotion/react @emotion/styled
// If you get type errors for MUI imports, you may need: npm install --save-dev @types/react @types/react-dom

import { useState, useEffect } from 'react';
import { useConfig, useIsDisabled, useValue } from './customElement/CustomElementContext';
import { getCommercetoolsToken, fetchCommercetoolsCategories } from './customElement/commercetoolsClient';
// @ts-ignore
import Autocomplete, { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
// @ts-ignore
import TextField from '@mui/material/TextField';
// @ts-ignore
import Chip from '@mui/material/Chip';
// @ts-ignore
import CircularProgress from '@mui/material/CircularProgress';
// @ts-ignore
import Box from '@mui/material/Box';
// @ts-ignore
import { SxProps } from '@mui/material/styles';

// Category type
interface Category {
  id: string;
  key?: string;
  name?: { [lang: string]: string };
  parent?: { typeId: string; id: string };
  children?: Category[];
  _depth?: number;
  [key: string]: any;
}

// Helper: build a tree from flat list
function buildCategoryTree(categories: Category[]): Category[] {
  const map: { [id: string]: Category } = {};
  categories.forEach((cat: Category) => {
    map[cat.id] = { ...cat, children: cat.children ?? [] };
  });
  const roots: Category[] = [];
  categories.forEach((cat: Category) => {
    if (
      cat.parent &&
      cat.parent.id &&
      map[cat.parent.id] !== undefined &&
      map[cat.id] !== undefined
    ) {
      map[cat.parent.id]?.children!.push(map[cat.id]!);
    } else if (map[cat.id] !== undefined) {
      roots.push(map[cat.id]!);
    }
  });
  return roots.filter(Boolean);
}

// Helper: flatten tree for Autocomplete, keeping depth for indentation
function flattenTree(nodes: Category[], depth = 0, arr: Category[] = []): Category[] {
  nodes.forEach((node: Category) => {
    if (!node) return;
    arr.push({ ...node, _depth: depth });
    if (node.children && node.children.length > 0) {
      flattenTree(node.children!, depth + 1, arr);
    }
  });
  return arr;
}

export const IntegrationApp = () => {
  // elementValue is always a string[] (array of category IDs)
  const [elementValue, setElementValue] = useValue();
  const isDisabled = useIsDisabled();
  const config = useConfig();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // selected category IDs (from elementValue)
  const selectedCategoryIds: string[] = Array.isArray(elementValue) ? elementValue : [];

  // For MUI Autocomplete: selected category objects
  const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(cat.id));

  useEffect(() => {
    setLoadingCategories(true);
    setCategoriesError(null);
    getCommercetoolsToken(config)
      .then((token: string) => fetchCommercetoolsCategories(token, config))
      .then((cats: Category[]) => {
        // Build tree, then flatten for Autocomplete
        const tree = buildCategoryTree(cats);
        const flat = flattenTree(tree);
        setCategories(flat);
      })
      .catch((e: Error) => setCategoriesError(e.message))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Only use value: Category[]
  const handleChange = (_: any, value: Category[]) => {
    setElementValue({ valueKey: value.map(cat => cat.id) });
  };

  return (
    <div>
      <h2>Commercetools Category Selector</h2>
      {loadingCategories && <CircularProgress size={24} />}
      {categoriesError && <div style={{ color: 'red' }}>Error: {categoriesError}</div>}
      {!loadingCategories && !categoriesError && (
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={categories}
          value={selectedCategories}
          onChange={handleChange}
          getOptionLabel={(option: Category) => option.name?.['en-US'] || option.key || option.id}
          isOptionEqualToValue={(opt: Category, val: Category) => opt.id === val.id}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField {...params} label="Select categories" placeholder="Search categories..." />
          )}
          renderOption={(props: React.HTMLAttributes<HTMLLIElement>, option: Category) => (
            <Box component="li" {...props} sx={{ pl: 2 + (option._depth || 0) * 2 }}>
              {option.name?.['en-US'] || option.key || option.id}
            </Box>
          )}
          renderTags={(value: Category[], getTagProps: (params: { index: number }) => Record<string, any>) =>
            value.map((option: Category, index: number) => (
              <Chip
                label={option.name?.['en-US'] || option.key || option.id}
                {...getTagProps({ index })}
                key={option.id}
              />
            ))
          }
          disabled={isDisabled}
          sx={{ minWidth: 350, maxWidth: 600, mt: 1 } as SxProps}
        />
      )}
      <div style={{ marginTop: 8 }}>
        <strong>Selected category IDs:</strong> {selectedCategoryIds.join(', ')}
      </div>
    </div>
  );
};

IntegrationApp.displayName = 'IntegrationApp';
