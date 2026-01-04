import { getPool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AssetMovement {
  id: number;
  asset_id: number;
  date: string;
  movement_type: 'entry' | 'exit' | 'dividend';
  quantity: number;
  price: number;
  total: number;
  fee_rate: number;
  total_after_fee: number;
  current_price: number | null;
  profit: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  asset_name?: string;
  asset_type?: string;
  asset_ticker?: string;
}

export interface CreateMovementData {
  asset_id: number;
  date: string;
  movement_type: 'entry' | 'exit' | 'dividend';
  quantity: number;
  price: number;
  fee_rate?: number;
  current_price?: number;
  notes?: string;
}

export interface UpdateMovementData extends Partial<CreateMovementData> {}

// Ensure table exists
export async function ensureMovementTableExists(): Promise<void> {
  const pool = await getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS asset_movements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      asset_id INT NOT NULL,
      date DATE NOT NULL,
      movement_type ENUM('entry', 'exit', 'dividend') NOT NULL,
      quantity DECIMAL(18, 2) NOT NULL,
      price DECIMAL(18, 2) NOT NULL,
      total DECIMAL(18, 2) NOT NULL,
      fee_rate DECIMAL(5, 2) DEFAULT 0,
      total_after_fee DECIMAL(18, 2) NOT NULL,
      current_price DECIMAL(18, 2) NULL,
      profit DECIMAL(18, 2) NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES investments(id) ON DELETE CASCADE
    )
  `);
}

export async function getAllMovements(): Promise<AssetMovement[]> {
  const pool = await getPool();
  await ensureMovementTableExists();

  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      m.*,
      i.name as asset_name,
      i.type as asset_type,
      i.ticker as asset_ticker
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
    ORDER BY m.date DESC, m.created_at DESC
  `);
  return rows as AssetMovement[];
}

export async function getMovementById(id: number): Promise<AssetMovement | null> {
  const pool = await getPool();
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      m.*,
      i.name as asset_name,
      i.type as asset_type,
      i.ticker as asset_ticker
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
    WHERE m.id = ?
  `, [id]);
  return rows.length > 0 ? (rows[0] as AssetMovement) : null;
}

export async function getMovementsByAsset(assetId: number): Promise<AssetMovement[]> {
  const pool = await getPool();
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      m.*,
      i.name as asset_name,
      i.type as asset_type,
      i.ticker as asset_ticker
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
    WHERE m.asset_id = ?
    ORDER BY m.date DESC
  `, [assetId]);
  return rows as AssetMovement[];
}

export async function getMovementsByDateRange(startDate: string, endDate: string): Promise<AssetMovement[]> {
  const pool = await getPool();
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      m.*,
      i.name as asset_name,
      i.type as asset_type,
      i.ticker as asset_ticker
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
    WHERE m.date BETWEEN ? AND ?
    ORDER BY m.date DESC
  `, [startDate, endDate]);
  return rows as AssetMovement[];
}

export async function createMovement(data: CreateMovementData): Promise<AssetMovement> {
  const pool = await getPool();
  await ensureMovementTableExists();

  const total = data.quantity * data.price;
  const feeRate = data.fee_rate || 0;
  const feeAmount = total * (feeRate / 100);

  let totalAfterFee: number;
  if (data.movement_type === 'entry') {
    totalAfterFee = total + feeAmount;  // Entry: pay more (total + fee)
  } else if (data.movement_type === 'exit') {
    totalAfterFee = total - feeAmount; // Exit: receive less (total - fee)
  } else {
    // Dividend: receive dividend minus tax/fees
    totalAfterFee = total - feeAmount;
  }

  // Calculate profit
  let profit: number | null = null;
  if (data.movement_type === 'dividend') {
    // Dividend: profit is the net amount received
    profit = totalAfterFee;
  } else if (data.current_price !== undefined && data.current_price !== null) {
    const currentTotal = data.quantity * data.current_price;
    profit = data.movement_type === 'entry'
      ? currentTotal - totalAfterFee  // Entry: profit = current value - cost
      : totalAfterFee - currentTotal; // Exit: profit = received - current value
  }

  const [result] = await pool.query<ResultSetHeader>(`
    INSERT INTO asset_movements (
      asset_id, date, movement_type, quantity, price, total,
      fee_rate, total_after_fee, current_price, profit, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.asset_id,
    data.date,
    data.movement_type,
    data.quantity,
    data.price,
    total,
    feeRate,
    totalAfterFee,
    data.current_price || null,
    profit,
    data.notes || null,
  ]);

  const movement = await getMovementById(result.insertId);
  return movement!;
}

export async function updateMovement(id: number, data: UpdateMovementData): Promise<AssetMovement | null> {
  const pool = await getPool();

  // Get existing movement
  const existing = await getMovementById(id);
  if (!existing) return null;

  // Merge with existing data
  const quantity = data.quantity ?? existing.quantity;
  const price = data.price ?? existing.price;
  const movementType = data.movement_type ?? existing.movement_type;
  const feeRate = data.fee_rate ?? existing.fee_rate;
  const currentPrice = data.current_price ?? existing.current_price;

  const total = quantity * price;
  const feeAmount = total * (feeRate / 100);

  let totalAfterFee: number;
  if (movementType === 'entry') {
    totalAfterFee = total + feeAmount;
  } else if (movementType === 'exit') {
    totalAfterFee = total - feeAmount;
  } else {
    // Dividend
    totalAfterFee = total - feeAmount;
  }

  let profit: number | null = null;
  if (movementType === 'dividend') {
    profit = totalAfterFee;
  } else if (currentPrice !== null) {
    const currentTotal = quantity * currentPrice;
    profit = movementType === 'entry'
      ? currentTotal - totalAfterFee
      : totalAfterFee - currentTotal;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (data.asset_id !== undefined) {
    fields.push('asset_id = ?');
    values.push(data.asset_id);
  }
  if (data.date !== undefined) {
    fields.push('date = ?');
    values.push(data.date);
  }
  if (data.movement_type !== undefined) {
    fields.push('movement_type = ?');
    values.push(data.movement_type);
  }
  if (data.quantity !== undefined || data.price !== undefined) {
    fields.push('quantity = ?', 'price = ?', 'total = ?');
    values.push(quantity, price, total);
  }
  if (data.fee_rate !== undefined || data.quantity !== undefined || data.price !== undefined) {
    fields.push('fee_rate = ?', 'total_after_fee = ?');
    values.push(feeRate, totalAfterFee);
  }
  if (data.current_price !== undefined) {
    fields.push('current_price = ?', 'profit = ?');
    values.push(currentPrice, profit);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(id);

  await pool.query(
    `UPDATE asset_movements SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getMovementById(id);
}

export async function deleteMovement(id: number): Promise<boolean> {
  const pool = await getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM asset_movements WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

export async function updateAllCurrentPrices(assetId: number, currentPrice: number): Promise<void> {
  const pool = await getPool();

  // Update current_price and recalculate profit for all movements of this asset
  // For dividends, profit stays as total_after_fee (received amount)
  await pool.query(`
    UPDATE asset_movements
    SET
      current_price = CASE WHEN movement_type = 'dividend' THEN current_price ELSE ? END,
      profit = CASE
        WHEN movement_type = 'dividend' THEN total_after_fee
        WHEN movement_type = 'entry' THEN (quantity * ?) - total_after_fee
        ELSE total_after_fee - (quantity * ?)
      END
    WHERE asset_id = ?
  `, [currentPrice, currentPrice, currentPrice, assetId]);
}

export async function getMovementsSummary(startDate?: string, endDate?: string): Promise<{
  totalEntries: number;
  totalExits: number;
  totalDividends: number;
  totalInvested: number;
  totalProfit: number;
}> {
  const pool = await getPool();
  await ensureMovementTableExists();

  let query = `
    SELECT
      SUM(CASE WHEN movement_type = 'entry' THEN total_after_fee ELSE 0 END) as totalEntries,
      SUM(CASE WHEN movement_type = 'exit' THEN total_after_fee ELSE 0 END) as totalExits,
      SUM(CASE WHEN movement_type = 'dividend' THEN total_after_fee ELSE 0 END) as totalDividends,
      SUM(CASE WHEN movement_type = 'entry' THEN total_after_fee WHEN movement_type = 'exit' THEN -total_after_fee ELSE 0 END) as totalInvested,
      COALESCE(SUM(profit), 0) as totalProfit
    FROM asset_movements
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` WHERE date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return {
    totalEntries: Number(rows[0].totalEntries) || 0,
    totalExits: Number(rows[0].totalExits) || 0,
    totalDividends: Number(rows[0].totalDividends) || 0,
    totalInvested: Number(rows[0].totalInvested) || 0,
    totalProfit: Number(rows[0].totalProfit) || 0,
  };
}

// Analytics: Profit by month
export async function getProfitByMonth(startDate?: string, endDate?: string): Promise<{
  month: string;
  entries: number;
  exits: number;
  dividends: number;
  profit: number;
}[]> {
  const pool = await getPool();
  await ensureMovementTableExists();

  let query = `
    SELECT
      DATE_FORMAT(date, '%Y-%m') as month,
      SUM(CASE WHEN movement_type = 'entry' THEN total_after_fee ELSE 0 END) as entries,
      SUM(CASE WHEN movement_type = 'exit' THEN total_after_fee ELSE 0 END) as exits,
      SUM(CASE WHEN movement_type = 'dividend' THEN total_after_fee ELSE 0 END) as dividends,
      COALESCE(SUM(profit), 0) as profit
    FROM asset_movements
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` WHERE date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows.map(row => ({
    month: row.month,
    entries: Number(row.entries) || 0,
    exits: Number(row.exits) || 0,
    dividends: Number(row.dividends) || 0,
    profit: Number(row.profit) || 0,
  }));
}

// Analytics: Profit by asset type
export async function getProfitByType(startDate?: string, endDate?: string): Promise<{
  type: string;
  entries: number;
  exits: number;
  dividends: number;
  profit: number;
  count: number;
}[]> {
  const pool = await getPool();
  await ensureMovementTableExists();

  let query = `
    SELECT
      i.type,
      SUM(CASE WHEN m.movement_type = 'entry' THEN m.total_after_fee ELSE 0 END) as entries,
      SUM(CASE WHEN m.movement_type = 'exit' THEN m.total_after_fee ELSE 0 END) as exits,
      SUM(CASE WHEN m.movement_type = 'dividend' THEN m.total_after_fee ELSE 0 END) as dividends,
      COALESCE(SUM(m.profit), 0) as profit,
      COUNT(*) as count
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` WHERE m.date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY i.type ORDER BY entries DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows.map(row => ({
    type: row.type,
    entries: Number(row.entries) || 0,
    exits: Number(row.exits) || 0,
    dividends: Number(row.dividends) || 0,
    profit: Number(row.profit) || 0,
    count: Number(row.count) || 0,
  }));
}

// Analytics: Profit by individual asset
export async function getProfitByAsset(startDate?: string, endDate?: string): Promise<{
  asset_id: number;
  asset_name: string;
  asset_ticker: string | null;
  asset_type: string;
  entries: number;
  exits: number;
  dividends: number;
  profit: number;
  quantity: number;
}[]> {
  const pool = await getPool();
  await ensureMovementTableExists();

  let query = `
    SELECT
      i.id as asset_id,
      i.name as asset_name,
      i.ticker as asset_ticker,
      i.type as asset_type,
      SUM(CASE WHEN m.movement_type = 'entry' THEN m.total_after_fee ELSE 0 END) as entries,
      SUM(CASE WHEN m.movement_type = 'exit' THEN m.total_after_fee ELSE 0 END) as exits,
      SUM(CASE WHEN m.movement_type = 'dividend' THEN m.total_after_fee ELSE 0 END) as dividends,
      COALESCE(SUM(m.profit), 0) as profit,
      SUM(CASE WHEN m.movement_type = 'entry' THEN m.quantity WHEN m.movement_type = 'exit' THEN -m.quantity ELSE 0 END) as quantity
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` WHERE m.date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY i.id, i.name, i.ticker, i.type ORDER BY entries DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows.map(row => ({
    asset_id: row.asset_id,
    asset_name: row.asset_name,
    asset_ticker: row.asset_ticker,
    asset_type: row.asset_type,
    entries: Number(row.entries) || 0,
    exits: Number(row.exits) || 0,
    dividends: Number(row.dividends) || 0,
    profit: Number(row.profit) || 0,
    quantity: Number(row.quantity) || 0,
  }));
}

// Analytics: Purchases by asset
export async function getPurchasesByAsset(startDate?: string, endDate?: string): Promise<{
  asset_id: number;
  asset_name: string;
  asset_ticker: string | null;
  asset_type: string;
  total_purchased: number;
  quantity_purchased: number;
  avg_price: number;
}[]> {
  const pool = await getPool();
  await ensureMovementTableExists();

  let query = `
    SELECT
      i.id as asset_id,
      i.name as asset_name,
      i.ticker as asset_ticker,
      i.type as asset_type,
      SUM(m.total_after_fee) as total_purchased,
      SUM(m.quantity) as quantity_purchased,
      AVG(m.price) as avg_price
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
    WHERE m.movement_type = 'entry'
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` AND m.date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY i.id, i.name, i.ticker, i.type ORDER BY total_purchased DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows.map(row => ({
    asset_id: row.asset_id,
    asset_name: row.asset_name,
    asset_ticker: row.asset_ticker,
    asset_type: row.asset_type,
    total_purchased: Number(row.total_purchased) || 0,
    quantity_purchased: Number(row.quantity_purchased) || 0,
    avg_price: Number(row.avg_price) || 0,
  }));
}

// Analytics: Purchases by asset type/category
export async function getPurchasesByCategory(startDate?: string, endDate?: string): Promise<{
  type: string;
  total_purchased: number;
  quantity_purchased: number;
  asset_count: number;
}[]> {
  const pool = await getPool();
  await ensureMovementTableExists();

  let query = `
    SELECT
      i.type,
      SUM(m.total_after_fee) as total_purchased,
      SUM(m.quantity) as quantity_purchased,
      COUNT(DISTINCT i.id) as asset_count
    FROM asset_movements m
    JOIN investments i ON m.asset_id = i.id
    WHERE m.movement_type = 'entry'
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` AND m.date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY i.type ORDER BY total_purchased DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows.map(row => ({
    type: row.type,
    total_purchased: Number(row.total_purchased) || 0,
    quantity_purchased: Number(row.quantity_purchased) || 0,
    asset_count: Number(row.asset_count) || 0,
  }));
}
