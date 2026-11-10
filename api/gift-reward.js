// Shared order gift-cycle rules.
export const DELIVERED_STATUSES = new Set(["delivered", "completed"]);

export function isDeliveredStatus(status) {
  return DELIVERED_STATUSES.has(String(status || "").toLowerCase());
}

export function normalizeGiftRewardConfig(siteConfig = {}) {
  const raw = siteConfig && siteConfig.homepage && siteConfig.homepage.giftReward;
  const reward = raw && typeof raw === "object" ? raw : {};
  const threshold = Number(reward.threshold);
  return {
    enabled: reward.enabled === true,
    active: reward.active === true,
    threshold: Number.isFinite(threshold) ? Math.max(1, Math.min(10000, Math.round(threshold))) : 20,
    productId: Number(reward.productId) || 0,
    productName: String(reward.productName || "").trim().slice(0, 200),
    productImage: String(reward.productImage || "").trim().slice(0, 500),
    giftBags: Array.isArray(siteConfig?.homepage?.giftBags) ? siteConfig.homepage.giftBags.filter((bag) => bag && bag.active !== false && bag.name).map((bag) => ({
      id: String(bag.id || "").slice(0, 80), name: String(bag.name).slice(0, 200), image: String(bag.image || "").slice(0, 500)
    })) : [],
    startedAt: reward.startedAt ? String(reward.startedAt) : "",
    cycleId: Number(reward.cycleId) || 0,
    awardedOrderId: String(reward.awardedOrderId || "")
  };
}

function orderTime(order) {
  const value = Date.parse(order && (order.at || order.createdAt || order.updatedAt));
  return Number.isFinite(value) ? value : 0;
}

export function deliveredOrdersInActiveCycle(orders = [], reward = {}) {
  const startedAt = Date.parse(reward.startedAt || "");
  return orders
    .filter((order) => isDeliveredStatus(order && order.status))
    .filter((order) => !Number.isFinite(startedAt) || orderTime(order) >= startedAt)
    .sort((a, b) => orderTime(a) - orderTime(b));
}

export function awardGiftIfEligible(order, existingOrders = [], siteConfig = {}) {
  const reward = normalizeGiftRewardConfig(siteConfig);
  if (!reward.enabled || !reward.active || !reward.productName) return { order, reward, awarded: false };
  if (order && order.giftReward && order.giftReward.awarded) return { order, reward, awarded: false };

  const delivered = deliveredOrdersInActiveCycle(existingOrders, reward);
  if (delivered.length < reward.threshold) return { order, reward, awarded: false };

  const selectedId = String(order.giftBagChoice?.id || "");
  const selectedBag = reward.giftBags.find((bag) => bag.id === selectedId);
  if (reward.giftBags.length && !selectedBag) return { order, reward, awarded: false, needsChoice: true, giftBags: reward.giftBags };
  const giftName = selectedBag?.name || reward.productName;
  const giftImage = selectedBag?.image || reward.productImage;
  if (!giftName) return { order, reward, awarded: false };

  const giftItem = {
    id: reward.productId,
    name: giftName,
    qty: 1,
    price: 0,
    lineTotal: 0,
    color: "",
    colors: [],
    image: giftImage,
    isGift: true
  };
  const alreadyInCart = Array.isArray(order.items) && order.items.some((item) => item && item.giftRewardBag === true && String(item.name || "") === String(giftName));
  const nextOrder = {
    ...order,
    items: alreadyInCart ? (Array.isArray(order.items) ? order.items : []) : [...(Array.isArray(order.items) ? order.items : []), giftItem],
    coupon: "",
    discount: 0,
    total: (Number(order.subtotal) || 0) + (Number(order.shipping) || 0),
    giftReward: {
      awarded: true,
      cycleId: reward.cycleId,
      threshold: reward.threshold,
      deliveredBeforeAward: delivered.length,
      productId: reward.productId,
      productName: giftName,
      awardedAt: new Date().toISOString()
    }
  };
  return { order: nextOrder, reward, awarded: true };
}

export function stoppedRewardConfig(reward, orderId) {
  return {
    ...reward,
    active: false,
    awardedOrderId: String(orderId || "")
  };
}
