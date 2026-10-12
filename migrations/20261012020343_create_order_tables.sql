-- Migration: create_order_tables
-- UP
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  order_reference_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN (
      'new',
      'queued',
      'printing',
      'printed',
      'handed_over',
      'cancelled'
    )
  ),
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  queued_at TEXT,
  printing_at TEXT,
  printed_at TEXT,
  handed_over_at TEXT,
  cancelled_at TEXT,
  price DECIMAL(10, 2),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  original_name TEXT NOT NULL,
  internal_name TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- size in bytes
  num_pages INTEGER NOT NULL,
  page_size TEXT CHECK (page_size IN ('a4', 'short', 'long')) NOT NULL DEFAULT 'short',
  -- sample entry: '1,2-5,7,9'
  -- 0.66 to 1
  full_color_pages TEXT,
  -- 0.33 to 0.66
  mid_color_pages TEXT,
  -- 0.01 to 0.33
  spot_color_pages TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE page_ranges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  page_range TEXT NOT NULL,
  copies INTEGER NOT NULL DEFAULT 1,
  page_size TEXT CHECK (page_size IN ('a4', 'short', 'long')) NOT NULL DEFAULT 'short',
  color TEXT CHECK (color IN ('colored', 'black and white')) NOT NULL DEFAULT 'black and white',
  duplex TEXT CHECK (duplex IN ('single sided', 'double sided')) NOT NULL DEFAULT 'single sided',
  FOREIGN KEY (file_id) REFERENCES files (id)
);

-- DOWN
DROP TABLE IF EXISTS page_ranges;

DROP TABLE IF EXISTS files;

DROP TABLE IF EXISTS orders;
