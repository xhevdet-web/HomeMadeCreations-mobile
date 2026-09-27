export interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}
export interface CatalogComponent extends CatalogCategory {
  categoryId: string;
  color: string | null;
  type: string | null;
  price: number;
  stock: number;
  category?: { id: string; name: string };
}
async function get(path: string, signal?: AbortSignal): Promise<unknown> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!baseUrl) throw new Error('The catalog API URL is not configured.');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) cancel();
  const timeout = setTimeout(cancel, 15000);
  try {
    const response = await fetch(baseUrl + path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`The catalog could not be loaded (${response.status}). Please retry.`);
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted)
      throw new Error('The catalog request timed out. Please retry.');
    if (error instanceof TypeError)
      throw new Error('Cannot reach the catalog. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
function parseCategory(value: unknown): CatalogCategory {
  const item = value as CatalogCategory | null;
  if (
    !item ||
    typeof item.id !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.isActive !== 'boolean' ||
    !Number.isFinite(item.sortOrder)
  )
    throw new Error('The catalog returned an invalid category. Please retry.');
  return {
    ...item,
    description: typeof item.description === 'string' ? item.description : null,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
  };
}
function parseComponent(value: unknown): CatalogComponent {
  const item = { ...(value as CatalogComponent), ...parseCategory(value) };
  if (
    typeof item.categoryId !== 'string' ||
    !Number.isSafeInteger(item.price) ||
    item.price < 0 ||
    !Number.isSafeInteger(item.stock) ||
    item.stock < 0
  )
    throw new Error('The catalog returned an invalid component. Please retry.');
  return {
    ...item,
    color: typeof item.color === 'string' ? item.color : null,
    type: typeof item.type === 'string' ? item.type : null,
  };
}
function activeList<T extends CatalogCategory>(value: unknown, parse: (entry: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('The catalog returned an invalid list. Please retry.');
  return value
    .map(parse)
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
export const fetchCategories = async (signal?: AbortSignal) =>
  activeList(await get('/categories', signal), parseCategory);
export const fetchCategory = async (id: string, signal?: AbortSignal) =>
  parseCategory(await get(`/categories/${encodeURIComponent(id)}`, signal));
export const fetchCategoryComponents = async (id: string, signal?: AbortSignal) =>
  activeList(
    await get(`/categories/${encodeURIComponent(id)}/sub-categories`, signal),
    parseComponent,
  );
export const fetchComponent = async (id: string, signal?: AbortSignal) =>
  parseComponent(await get(`/sub-categories/${encodeURIComponent(id)}`, signal));
