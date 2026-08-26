import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import QuantityControl from '@/components/QuantityControl';
import { getMinPortionCount, type IDish } from '@/data/menu';

interface DishCardProps {
  dish: IDish
  quantity: number
  onAdd: () => void
  onDecrease: () => void
  disabled?: boolean
  totalQuantity?: number
  disabledText?: string
}

export default function DishCard({ dish, quantity, onAdd, onDecrease, disabled, totalQuantity = 0, disabledText }: DishCardProps) {
  const showTotal = disabled && totalQuantity > 0;
  // 每份最小串数（串类取 spec 小值，耗材为 1）
  const perPortion = getMinPortionCount(dish);
  // 已点总数换算为串/袋/瓶/把：份数 × 每份最小数量
  const totalUnits = totalQuantity * perPortion;
  // 同桌已点（按单位）达到/超过基础数量 → 标红提示
  const overBase = dish.baseQuantity != null && totalUnits >= dish.baseQuantity;

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${
        overBase ? 'border-red-500/40 bg-red-500/[0.03]' : ''
      }`}
    >
      <CardContent className="p-4 flex gap-3">
        <div className="shrink-0 w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-4xl">
          {dish.emoji}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">{dish.name}</h3>
              {/* 同桌已点总数（含已提交订单），有基础数量的菜品常显、带单位 */}
              {dish.baseQuantity != null && (
                <span
                  className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                    overBase
                      ? 'bg-red-500/10 text-red-600 border-red-500/30'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}
                  title={overBase ? '已达/超过基础数量' : '同桌已点份数（单位：串/袋/瓶/把）'}
                >
                  已点 {totalUnits}{dish.unit ?? ''}/{dish.baseQuantity}{dish.unit ?? ''}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dish.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {dish.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                  {tag}
                </Badge>
              ))}
              {dish.baseQuantity != null && overBase && (
                <Badge className="text-[10px] h-4 px-1.5 font-normal bg-red-500/10 text-red-600 border border-red-500/30">
                  已超基础量
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-primary font-bold text-lg">
                ¥{dish.price}
              </span>
              {dish.spec && (
                <span className="text-[11px] text-muted-foreground">
                  /{dish.spec}
                </span>
              )}
            </div>
            {showTotal ? (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {disabledText ?? `已点 ×${totalQuantity}`}
              </span>
            ) : (
              <QuantityControl
                quantity={quantity}
                onIncrease={onAdd}
                onDecrease={onDecrease}
                size="sm"
                disabled={disabled}
                accent={overBase ? 'danger' : undefined}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
