DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    jwt_sub TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_reference_number TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    pending_at TIMESTAMP,
    in_progress_at TIMESTAMP,
    completed_at TIMESTAMP,
    handed_over_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    -- n, New | pe, Pending | pr, In Progress | co, Completed | ho, Handed over | ca, Cancelled
    status TEXT CHECK( status IN ('n', 'pe', 'pr', 'co', 'ho', 'ca') ) NOT NULL DEFAULT 'n', 
    price DECIMAL(10, 2),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

DROP TABLE IF EXISTS files;
CREATE TABLE files (
    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    md5_hash TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    num_pages INTEGER NOT NULL,
    -- 0.66 to 1
    -- sample entry: '1,2-5,7,9'
    full_color_pages TEXT,
    -- 0.33 to 0.66
    mid_color_pages TEXT,
    -- 0.01 to 0.33
    spot_color_pages TEXT,
    paper_size TEXT CHECK( paper_size IN ('a', 's', 'l') ) NOT NULL DEFAULT 's',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

DROP TABLE IF EXISTS page_ranges;
CREATE TABLE page_ranges (
    page_range_id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    page_range TEXT NOT NULL,
    copies INTEGER NOT NULL DEFAULT 1,
    -- a, A4 | s, Short | l, Long
    paper_size TEXT CHECK( paper_size IN ('a', 's', 'l') ) NOT NULL DEFAULT 's',
    -- c, Colored | b, Black and White
    color TEXT CHECK( color IN ('c', 'b') ) NOT NULL DEFAULT 'b', 
    -- s, Single-sided | d, Double-sided
    duplex TEXT CHECK( duplex IN ('s', 'd') ) NOT NULL DEFAULT 's',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files(file_id)
);
