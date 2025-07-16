import { customAlphabet } from "nanoid";
import db from "../db/db.js";
const nanoid = customAlphabet(
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

export const getOrder = async (req, res) => {
  const { user_id, username } = db
    .prepare(
      `
      SELECT user_id, username FROM users WHERE jwt_sub = ?
      `,
    )
    .get(req.user.sub);

  let newOrder = db
    .prepare(
      `
      SELECT order_reference_number, order_id FROM orders
      WHERE orders.status = 'n'
      AND user_id = ?
      `,
    )
    .get(user_id);

  if (!newOrder) {
    const orderRefNumber = nanoid();
    db.prepare(
      `
      INSERT INTO orders (user_id, order_reference_number, status)
      VALUES (?, ?, ?)
      `,
    ).run(user_id, orderRefNumber, "n");
    res.json({ username, orderRefNumber: orderRefNumber, files: [] });
  } else {
    const files = db
      .prepare(
        `
        SELECT file_name, md5_hash, num_pages, full_color_pages, mid_color_pages, spot_color_pages, paper_size
        FROM orders
        RIGHT JOIN files ON orders.order_id = files.order_id
        WHERE orders.order_reference_number = ?
        `,
      )
      .bind(newOrder.order_reference_number)
      .all();

    res.json({
      username,
      orderRefNumber: newOrder.order_reference_number,
      files,
    });
  }
};
