import { AlertTriangle, DollarSign, Package, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";

/**
 * Dados de exemplo — nenhum endpoint de dashboard existe no backend ainda
 * (só GET /admin/products, /admin/suppliers e mutações de variant/order).
 * Trocar por chamadas reais assim que houver:
 *   - GET /admin/dashboard (ou agregações client-side de /admin/products
 *     e um futuro /admin/orders) para receita, pedidos do dia e margem.
 */
const MOCK_STATS = {
  ordersToday: 7,
  revenueToday: 4189.3,
  estimatedMarginToday: 1523.4,
  lowStockAlerts: 3,
};

const MOCK_RECENT_ORDERS = [
  { id: "a1b2c3d4", customer: "Ana Souza", total: 599.9, status: "pending_payment" },
  { id: "e5f6g7h8", customer: "Bruno Lima", total: 899.9, status: "paid" },
  { id: "i9j0k1l2", customer: "Carla Dias", total: 249.9, status: "awaiting_supplier_order" },
];

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  awaiting_supplier_order: "Aguardando repasse",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dados de exemplo — nenhum endpoint de agregação existe no backend ainda.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="Pedidos Hoje"
          value={String(MOCK_STATS.ordersToday)}
        />
        <StatCard
          icon={DollarSign}
          label="Receita Hoje"
          value={formatPrice(MOCK_STATS.revenueToday)}
        />
        <StatCard
          icon={DollarSign}
          label="Margem Estimada"
          value={formatPrice(MOCK_STATS.estimatedMarginToday)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertas de Estoque"
          value={String(MOCK_STATS.lowStockAlerts)}
          accent
        />
      </div>

      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Pedidos Recentes
        </h2>
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-xs uppercase tracking-[0.05em] text-muted-foreground">
                <th className="text-left px-4 py-3">Pedido</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs uppercase tracking-[0.05em] bg-secondary px-2 py-1">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-dashed border-border p-4 flex gap-3">
        <Package className="size-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Este painel consome apenas o que já existe na API (produtos, fornecedores,
          variantes). Pedidos, clientes e as métricas acima ainda precisam dos endpoints
          admin correspondentes no backend — ver roadmap na seção 11 de{" "}
          <code>havoc-documentacao-tecnica.md</code>.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-border p-4">
      <Icon className={accent ? "size-5 text-destructive" : "size-5 text-muted-foreground"} />
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground mt-3">
        {label}
      </p>
      <p className="font-display text-2xl mt-1">{value}</p>
    </div>
  );
}
