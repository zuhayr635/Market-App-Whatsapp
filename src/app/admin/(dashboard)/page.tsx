import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Users,
  Package,
} from "lucide-react"

const stats = [
  {
    title: "Bugünkü Siparişler",
    value: "0",
    icon: ShoppingCart,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Toplam Ciro",
    value: "₺0",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Bekleyen Siparişler",
    value: "0",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Toplam Üye",
    value: "0",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Son Siparişler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="mb-3 h-12 w-12 opacity-20" />
            <p>Henüz sipariş bulunmuyor</p>
          </div>
        </CardContent>
      </Card>

      {/* Low stock products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Düşük Stoklu Ürünler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="mb-3 h-12 w-12 opacity-20" />
            <p>Düşük stoklu ürün bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
