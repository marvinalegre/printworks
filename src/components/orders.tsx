interface File {
  id: number;
  filename: string;
  numPages: number;
}

interface Order {
  id: number;
  status: string;
  createdAt: string;
  files: File[];
}

interface Props {
  orders: Order[];
}

const statusLabels = {
  new: "New",
  queued: "Queued",
  printing: "Printing",
  printed: "Printed",
  handed_over: "Handed over",
  cancelled: "Cancelled",
} as const;

export const Orders = ({ orders }: Props) => (
  <section class="container">
    <h2>Orders</h2>

    {orders.length === 0 ? (
      <p>No orders yet.</p>
    ) : (
      orders.map((order) => (
        <article key={order.id} className="order">
          <header className="order-header">
            <strong>Order #{order.id}</strong>
            <span className={`status-badge status-${order.status}`}>
              {statusLabels[order.status]}
            </span>
          </header>

          <p>
            {order.files.length} file
            {order.files.length !== 1 ? "s" : ""}
            {" · "}
            {timeAgo(order.createdAt)}
          </p>

          <ul>
            {order.files.map((file) => (
              <li>
                {file.filename}
                <small> · {file.numPages} pages</small>
              </li>
            ))}
          </ul>
        </article>
      ))
    )}
  </section>
);

const rtf = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function timeAgo(date: string | Date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);

  if (abs < 60) return "now";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(seconds / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(seconds / 2592000), "month");

  return rtf.format(Math.round(seconds / 31536000), "year");
}
