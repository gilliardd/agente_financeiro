import { query } from '../config/database';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'investment';
  icon: string;
  color: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function getAllCategories(): Promise<Category[]> {
  return query<Category[]>('SELECT * FROM categories WHERE is_active = true ORDER BY name');
}

export async function getCategoriesByType(type: 'income' | 'expense' | 'investment'): Promise<Category[]> {
  return query<Category[]>(
    'SELECT * FROM categories WHERE type = ? AND is_active = true ORDER BY name',
    [type]
  );
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const rows = await query<Category[]>('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function getCategoryByName(name: string, type: 'income' | 'expense'): Promise<Category | null> {
  const rows = await query<Category[]>(
    'SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND is_active = true',
    [name, type]
  );
  return rows[0] || null;
}

export async function findBestCategoryMatch(name: string, type: 'income' | 'expense'): Promise<Category | null> {
  // Primeiro tenta match exato
  let category = await getCategoryByName(name, type);
  if (category) return category;

  // Busca todas as categorias do tipo
  const categories = await getCategoriesByType(type);

  // Tenta match parcial
  const lowerName = name.toLowerCase();
  for (const cat of categories) {
    if (cat.name.toLowerCase().includes(lowerName) || lowerName.includes(cat.name.toLowerCase())) {
      return cat;
    }
  }

  // Retorna categoria "Outros" como fallback
  return categories.find((c) => c.name.toLowerCase() === 'outros') || categories[0] || null;
}

export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense' | 'investment';
  icon?: string;
  color?: string;
}

export async function createCategory(data: CreateCategoryDTO): Promise<number> {
  const result = await query<any>(
    `INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)`,
    [data.name, data.type, data.icon || 'circle', data.color || '#6B7280']
  );
  return result.insertId;
}

export async function updateCategory(id: number, data: Partial<CreateCategoryDTO>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.icon) {
    fields.push('icon = ?');
    values.push(data.icon);
  }
  if (data.color) {
    fields.push('color = ?');
    values.push(data.color);
  }

  if (fields.length > 0) {
    values.push(id);
    await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteCategory(id: number): Promise<void> {
  await query('UPDATE categories SET is_active = false WHERE id = ?', [id]);
}
