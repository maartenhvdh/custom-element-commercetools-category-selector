import { Config } from "./config";

// Get commercetools API token
export async function getCommercetoolsToken(config: Config) {
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('scope', 'view_products:kontent-ai-breville view_project_settings:kontent-ai-breville view_categories:kontent-ai-breville');

  const resp = await fetch(config.authUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${config.clientId}:${config.clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!resp.ok) {
    throw new Error('Failed to authenticate with commercetools');
  }
  const data = await resp.json();
  return data.access_token;
}

// Fetch all categories (paginated)
export async function fetchCommercetoolsCategories(token: string, config: Config) {
  let categories: any[] = [];
  let limit = 500;
  let offset = 0;
  let total = 0;
  do {
    const resp = await fetch(`${config.apiUrl}/${config.projectKey}/categories?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) {
      throw new Error('Failed to fetch categories from commercetools');
    }
    const data = await resp.json();
    categories = categories.concat(data.results);
    total = data.total;
    offset += limit;
  } while (categories.length < total);
  return categories;
} 