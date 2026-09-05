import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, ShopItem, CartItem, CURRENCY_LABELS, SHOP_AREA_LABELS, Coupon } from '@/lib/supabase';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  Store, ShoppingCart, Trash2, CheckCircle2, AlertCircle, Package, Coins,
  Sparkles, Skull, Search, X, Crown, Star, Flame, Zap, Loader2, Pencil, Save, Ticket
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ShopPage() {
  const { profile, user, refreshProfile, isAdmin } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<ShopItem | null>(null);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ShopItem>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{ itemNames: string[]; totals: { huaTien: number; congDuc: number; amDuc: number } } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase.from('shop_items').select('*').order('price', { ascending: true });
    if (!error && data) setItems(data as ShopItem[]);
    setLoading(false);
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('carts')
      .select('*, shop_items(*)')
      .eq('user_id', user.id);
    if (!error && data) setCart(data as CartItem[]);
  }, [user]);

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (!error && data) setCoupons(data as Coupon[]);
  }, [user]);

  useEffect(() => {
    fetchItems();
    fetchCart();
    fetchCoupons();
  }, [fetchItems, fetchCart, fetchCoupons]);

  const addToCart = async (item: ShopItem) => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua sắm.', 'error');
      return;
    }
    if (cart.length >= 10) {
      showNotification('Giỏ hàng đã đạt giới hạn tối đa 10 món!', 'error');
      return;
    }
    const { error } = await supabase.from('carts').insert([{ user_id: user.id, item_id: item.id }]);
    if (error) {
      showNotification(`Lỗi: ${error.message}`, 'error');
    } else {
      showNotification(`Đã thêm "${item.name}" vào giỏ hàng.`);
      fetchCart();
    }
  };

  const removeFromCart = async (cartId: string) => {
    const { error } = await supabase.from('carts').delete().eq('id', cartId);
    if (!error) fetchCart();
  };

  const buyNow = (item: ShopItem) => {
    if (!user || !profile) {
      showNotification('Vui lòng đăng nhập để mua sắm.', 'error');
      return;
    }
    setSelectedCouponId(null);
    setConfirmBuy(item);
  };

  const executeBuyNow = async () => {
    if (!confirmBuy) return;
    const item = confirmBuy;
    setBuyingId(item.id);

    try {
      const rpcParams: Record<string, unknown> = { p_item_ids: [item.id] };
      if (selectedCouponId) rpcParams.p_coupon_id = selectedCouponId;
      const { error } = await supabase.rpc('purchase_items', rpcParams);

      if (error) {
        showNotification(error.message, 'error');
        return;
      }

      setConfirmBuy(null);
      setSelectedCouponId(null);
      showNotification(`Đã mua "${item.name}" — vật phẩm đã vào kho.`);
      setPurchaseSuccess({ itemNames: [item.name], totals: { huaTien: item.currency_type === 'HUA_TIEN' ? item.price : 0, congDuc: item.currency_type === 'CONG_DUC' ? item.price : 0, amDuc: item.currency_type === 'AM_DUC' ? item.price : 0 } });
      fetchCart();
      fetchCoupons();
      refreshProfile();
    } catch {
      showNotification('Lỗi kết nối, vui lòng thử lại.', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  const handleCheckout = () => {
    if (!user || !profile || cart.length === 0) return;
    setCheckoutOpen(false);
    setConfirmCheckout(true);
  };

  const executeCheckout = async () => {
    if (!user || !profile) {
      showNotification('Vui lòng đăng nhập để mua sắm.', 'error');
      return;
    }
    setProcessing(true);

    const itemIds = cart.map(c => c.item_id);
    const rpcParams: Record<string, unknown> = { p_item_ids: itemIds };
    if (selectedCouponId) rpcParams.p_coupon_id = selectedCouponId;
    const { error } = await supabase.rpc('purchase_items', rpcParams);

    if (error) {
      showNotification(error.message, 'error');
      setProcessing(false);
      throw error;
    }

    const purchasedNames = cart.map(c => c.shop_items?.name || '').filter(Boolean);
    setConfirmCheckout(false);
    setProcessing(false);
    setSelectedCouponId(null);
    setPurchaseSuccess({ itemNames: purchasedNames, totals: { ...discountedTotals } });
    fetchCart();
    fetchCoupons();
    refreshProfile();
  };

  const startEdit = (item: ShopItem) => {
    setEditingId(item.id);
    setEditForm({
      price: item.price,
      currency_type: item.currency_type,
      price_secondary: item.price_secondary,
      currency_type_secondary: item.currency_type_secondary,
      purchase_limit: item.purchase_limit,
      shop_area: item.shop_area,
      description: item.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (item: ShopItem) => {
    setSavingId(item.id);
    const updates: Record<string, unknown> = {};
    if (editForm.price !== undefined && editForm.price !== item.price) updates.price = editForm.price;
    if (editForm.currency_type !== undefined && editForm.currency_type !== item.currency_type) updates.currency_type = editForm.currency_type;
    if (editForm.price_secondary !== item.price_secondary) updates.price_secondary = editForm.price_secondary || null;
    if (editForm.currency_type_secondary !== item.currency_type_secondary) updates.currency_type_secondary = editForm.currency_type_secondary || null;
    if (editForm.purchase_limit !== item.purchase_limit) updates.purchase_limit = editForm.purchase_limit || null;
    if (editForm.shop_area !== undefined && editForm.shop_area !== item.shop_area) updates.shop_area = editForm.shop_area;
    if (editForm.description !== undefined && editForm.description !== item.description) updates.description = editForm.description;

    if (Object.keys(updates).length === 0) {
      cancelEdit();
      setSavingId(null);
      return;
    }

    const { error } = await supabase.from('shop_items').update(updates).eq('id', item.id);
    if (error) {
      showNotification(`Lỗi: ${error.message}`, 'error');
    } else {
      showNotification(`Đã cập nhật "${item.name}".`);
      fetchItems();
    }
    setSavingId(null);
    cancelEdit();
  };

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];
  const areas = ['all', 'Thường', 'Hiếm', 'Sự kiện'];
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesArea = filterArea === 'all' || item.shop_area === filterArea;
    return matchesSearch && matchesCategory && matchesArea;
  });

  const cartTotals = cart.reduce(
    (acc, c) => {
      if (c.shop_items) {
        if (c.shop_items.currency_type === 'HUA_TIEN') acc.huaTien += c.shop_items.price;
        if (c.shop_items.currency_type === 'CONG_DUC') acc.congDuc += c.shop_items.price;
        if (c.shop_items.currency_type === 'AM_DUC') acc.amDuc += c.shop_items.price;
        if (c.shop_items.currency_type_secondary === 'HUA_TIEN') acc.huaTien += c.shop_items.price_secondary || 0;
        if (c.shop_items.currency_type_secondary === 'CONG_DUC') acc.congDuc += c.shop_items.price_secondary || 0;
        if (c.shop_items.currency_type_secondary === 'AM_DUC') acc.amDuc += c.shop_items.price_secondary || 0;
      }
      return acc;
    },
    { huaTien: 0, congDuc: 0, amDuc: 0 }
  );

  const selectedCoupon = coupons.find(c => c.id === selectedCouponId) || null;
  const couponDiscount = selectedCoupon ? selectedCoupon.discount_percent : 0;
  const discountedTotals = {
    huaTien: couponDiscount > 0 ? Math.ceil(cartTotals.huaTien * (1 - couponDiscount / 100)) : cartTotals.huaTien,
    congDuc: couponDiscount > 0 ? Math.ceil(cartTotals.congDuc * (1 - couponDiscount / 100)) : cartTotals.congDuc,
    amDuc: couponDiscount > 0 ? Math.ceil(cartTotals.amDuc * (1 - couponDiscount / 100)) : cartTotals.amDuc,
  };

  const getCurrencyIcon = (type: string, size = 'w-3.5 h-3.5') => {
    if (type === 'HUA_TIEN') return <Coins className={`${size} text-amber-400 inline`} />;
    if (type === 'CONG_DUC') return <Sparkles className={`${size} text-cyan-400 inline`} />;
    if (type === 'AM_DUC') return <Skull className={`${size} text-amber-400 inline`} />;
    return null;
  };

  const getAreaIcon = (area: string) => {
    if (area === 'Hiếm') return <Crown className="w-4 h-4 text-amber-400" />;
    if (area === 'Sự kiện') return <Flame className="w-4 h-4 text-red-400" />;
    return <Package className="w-4 h-4 text-gray-400" />;
  };

  const getAreaBadgeColor = (area: string) => {
    if (area === 'Hiếm') return 'bg-amber-500/15 text-amber-300/90 border-amber-500/30';
    if (area === 'Sự kiện') return 'bg-red-500/15 text-red-300/90 border-red-500/30';
    return 'bg-white/5 text-gray-400 border-white/10';
  };

  const renderPrice = (item: ShopItem) => {
    const parts = [
      <span key="primary" className="flex items-center gap-1">
        {getCurrencyIcon(item.currency_type)}
        <span className="text-sm font-bold text-amber-200">{item.price}</span>
        <span className="text-xs text-gray-500">{CURRENCY_LABELS[item.currency_type]}</span>
      </span>,
    ];
    if (item.price_secondary && item.currency_type_secondary) {
      parts.push(
        <span key="secondary" className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">/</span>
          {getCurrencyIcon(item.currency_type_secondary)}
          <span className="text-sm font-bold text-amber-200">{item.price_secondary}</span>
          <span className="text-xs text-gray-500">{CURRENCY_LABELS[item.currency_type_secondary]}</span>
        </span>
      );
    }
    return <div className="flex items-center gap-1.5 flex-wrap">{parts}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Thương Thành</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Thương Thành Hệ Thống</h2>
        <p className="text-sm text-gray-500 mt-2">Giao dịch vật phẩm, pháp khí, linh dược — mọi giao dịch đều được ghi vết</p>
      </div>

      {notification && (
        <div className={`p-3 rounded-lg border flex items-center gap-2 ${
          notificationType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
        }`}>
          {notificationType === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span className={`text-sm ${notificationType === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{notification}</span>
        </div>
      )}

      {/* Stats overview */}
      <StatGrid cols={4}>
        <StatCard label="Tổng Vật Phẩm" value={items.length} icon={Package} accent="gold" />
        <StatCard label="Vật Phẩm Hiếm" value={items.filter(i => i.shop_area === 'Hiếm').length} icon={Crown} accent="vermilion" />
        <StatCard label="Sự Kiện" value={items.filter(i => i.shop_area === 'Sự kiện').length} icon={Flame} accent="vermilion" />
        <StatCard label="Giỏ Hàng" value={`${cart.length}/10`} icon={ShoppingCart} accent={cart.length > 0 ? 'gold' : 'neutral'} hint={cart.length > 0 ? 'Sẵn sàng thanh toán' : 'Trống'} />
      </StatGrid>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm vật phẩm..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
          />
        </div>
        <select
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
        >
          {areas.map(area => (
            <option key={area} value={area}>{area === 'all' ? 'Tất cả khu vực' : SHOP_AREA_LABELS[area] || area}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'Tất cả danh mục' : cat}</option>
          ))}
        </select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map(item => {
          const isEditing = editingId === item.id;
          return (
          <div
            key={item.id}
            className={`group relative p-5 rounded-xl bg-black/30 backdrop-blur-sm transition-all duration-300 ${
              isEditing ? 'border-2 border-amber-500/50' : 'border border-white/5 hover:border-[#670201]/30'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#670201]/15 flex items-center justify-center">
                {getAreaIcon(item.shop_area)}
              </div>
              <div className="flex flex-col items-end gap-1">
                {isEditing ? (
                  <select
                    value={editForm.shop_area ?? item.shop_area}
                    onChange={e => setEditForm(f => ({ ...f, shop_area: e.target.value }))}
                    className="text-xs px-2 py-1 rounded border border-amber-500/30 bg-black/40 text-amber-200 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Hiếm">Hiếm</option>
                    <option value="Sự kiện">Sự kiện</option>
                  </select>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded border ${getAreaBadgeColor(item.shop_area)}`}>
                    {item.shop_area}
                  </span>
                )}
                <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-white/5">{item.category}</span>
              </div>
            </div>
            <h4 className="font-bold text-base text-amber-100/90 mb-1">{item.name}</h4>
            {isEditing ? (
              <div className="mb-3">
                <label className="text-[10px] text-gray-500 block mb-1">Mô tả vật phẩm</label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  className="w-full px-2 py-1.5 bg-black/40 border border-amber-500/30 rounded text-xs text-gray-300 leading-relaxed focus:outline-none focus:border-amber-500/60 resize-y"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-500 leading-relaxed mb-3 min-h-[2.5rem]">{item.description}</p>
            )}

            {isEditing ? (
              <div className="space-y-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-14 shrink-0">Giá chính</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.price ?? 0}
                    onChange={e => setEditForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                    className="w-20 px-2 py-1 bg-black/40 border border-amber-500/30 rounded text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                  />
                  <select
                    value={editForm.currency_type ?? item.currency_type}
                    onChange={e => setEditForm(f => ({ ...f, currency_type: e.target.value }))}
                    className="px-2 py-1 bg-black/40 border border-amber-500/30 rounded text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-14 shrink-0">Giá phụ</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.price_secondary ?? ''}
                    placeholder="—"
                    onChange={e => setEditForm(f => ({ ...f, price_secondary: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-20 px-2 py-1 bg-black/40 border border-amber-500/30 rounded text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                  />
                  <select
                    value={editForm.currency_type_secondary ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, currency_type_secondary: e.target.value || null }))}
                    className="px-2 py-1 bg-black/40 border border-amber-500/30 rounded text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="">— Không —</option>
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-14 shrink-0">Giới hạn</label>
                  <input
                    type="text"
                    value={editForm.purchase_limit ?? ''}
                    placeholder="—"
                    onChange={e => setEditForm(f => ({ ...f, purchase_limit: e.target.value || null }))}
                    className="flex-1 px-2 py-1 bg-black/40 border border-amber-500/30 rounded text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            ) : (
              <>
                {item.purchase_limit && (
                  <p className="text-[10px] text-gray-600 mb-3 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Giới hạn: {item.purchase_limit}
                  </p>
                )}
              </>
            )}

            <div className="flex items-center justify-between gap-2">
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => saveEdit(item)}
                    disabled={savingId === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Lưu
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-all border border-white/10"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <>
                  {renderPrice(item)}
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => startEdit(item)}
                        title="Sửa giá"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-lg transition-all hover:scale-105 border border-amber-500/20"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {user ? (
                      <>
                        <button
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-all hover:scale-105 border border-white/10"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Giỏ
                        </button>
                        <button
                          onClick={() => buyNow(item)}
                          disabled={buyingId === item.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#670201]/80 hover:bg-[#670201] text-amber-100 text-xs font-semibold rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buyingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          Mua
                        </button>
                      </>
                    ) : (
                      <Link to="/login" className="text-xs font-semibold text-amber-300 hover:text-amber-100 underline">Đăng nhập để mua</Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy vật phẩm nào.</p>
        </div>
      )}

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setCheckoutOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-full shadow-2xl shadow-[#670201]/40 hover:scale-105 transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{cart.length}/10</span>
        </button>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)}>
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#1a0a0a] border border-[#670201]/30 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-amber-100">Giỏ Hàng ({cart.length}/10)</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {cart.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{c.shop_items?.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getCurrencyIcon(c.shop_items?.currency_type || '')}
                      <span className="text-xs text-amber-200">{c.shop_items?.price}</span>
                      {c.shop_items?.price_secondary && c.shop_items?.currency_type_secondary && (
                        <>
                          <span className="text-gray-600 text-xs">/</span>
                          {getCurrencyIcon(c.shop_items.currency_type_secondary)}
                          <span className="text-xs text-amber-200">{c.shop_items.price_secondary}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(c.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              {cartTotals.huaTien > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5"><Coins className="w-4 h-4 text-amber-400" /> Hoa Tiền</span>
                  <div className="flex items-center gap-2">
                    {couponDiscount > 0 && cartTotals.huaTien !== discountedTotals.huaTien && (
                      <span className="text-xs text-gray-600 line-through">{cartTotals.huaTien}</span>
                    )}
                    <span className="text-amber-200 font-bold">{discountedTotals.huaTien}</span>
                  </div>
                </div>
              )}
              {cartTotals.congDuc > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-cyan-400" /> Công Đức</span>
                  <div className="flex items-center gap-2">
                    {couponDiscount > 0 && cartTotals.congDuc !== discountedTotals.congDuc && (
                      <span className="text-xs text-gray-600 line-through">{cartTotals.congDuc}</span>
                    )}
                    <span className="text-cyan-200 font-bold">{discountedTotals.congDuc}</span>
                  </div>
                </div>
              )}
              {cartTotals.amDuc > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5"><Skull className="w-4 h-4 text-amber-400" /> Âm Đức</span>
                  <div className="flex items-center gap-2">
                    {couponDiscount > 0 && cartTotals.amDuc !== discountedTotals.amDuc && (
                      <span className="text-xs text-gray-600 line-through">{cartTotals.amDuc}</span>
                    )}
                    <span className="text-amber-200 font-bold">{discountedTotals.amDuc}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Coupon selector */}
            {coupons.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <label className="text-xs font-semibold text-amber-200/80">Phiếu giảm giá</label>
                </div>
                <select
                  value={selectedCouponId ?? ''}
                  onChange={e => setSelectedCouponId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-black/40 border border-amber-500/20 rounded-lg text-sm text-amber-100 focus:outline-none focus:border-amber-500/40 transition-all"
                >
                  <option value="">Không sử dụng phiếu</option>
                  {coupons.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} — giảm {c.discount_percent}% (còn {c.max_uses - c.used_count} lượt)
                    </option>
                  ))}
                </select>
                {selectedCoupon && (
                  <p className="text-[10px] text-amber-300/60 mt-1.5">
                    Áp dụng giảm {selectedCoupon.discount_percent}% cho toàn bộ đơn hàng.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0}
              className="w-full mt-6 py-3 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-lg hover:shadow-lg hover:shadow-[#670201]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? 'Đang xử lý...' : 'Thanh Toán'}
            </button>
          </div>
        </div>
      )}

      {/* Buy Now Modal with Coupon Selector */}
      {confirmBuy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { if (!buyingId) setConfirmBuy(null); }}>
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#1a0a0a] border border-[#670201]/40 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-serif font-bold text-amber-100/90">Mua Hàng</h3>
              <button onClick={() => { if (!buyingId) setConfirmBuy(null); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-black/30 border border-white/5 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Vật phẩm</span>
                <span className="text-gray-200 font-semibold">{confirmBuy.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Giá gốc</span>
                <span className="text-gray-200 font-semibold flex items-center gap-1.5">
                  {getCurrencyIcon(confirmBuy.currency_type)}
                  {confirmBuy.price} <span className="text-xs text-gray-500">{CURRENCY_LABELS[confirmBuy.currency_type]}</span>
                </span>
              </div>
              {confirmBuy.price_secondary && confirmBuy.currency_type_secondary && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Giá phụ</span>
                  <span className="text-gray-200 font-semibold flex items-center gap-1.5">
                    {getCurrencyIcon(confirmBuy.currency_type_secondary)}
                    {confirmBuy.price_secondary} <span className="text-xs text-gray-500">{CURRENCY_LABELS[confirmBuy.currency_type_secondary]}</span>
                  </span>
                </div>
              )}
            </div>

            {coupons.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <label className="text-xs font-semibold text-amber-200/80">Phiếu giảm giá</label>
                </div>
                <select
                  value={selectedCouponId ?? ''}
                  onChange={e => setSelectedCouponId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-black/40 border border-amber-500/20 rounded-lg text-sm text-amber-100 focus:outline-none focus:border-amber-500/40 transition-all"
                >
                  <option value="">Không sử dụng phiếu</option>
                  {coupons.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} — giảm {c.discount_percent}% (còn {c.max_uses - c.used_count} lượt)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCoupon && confirmBuy && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Giảm giá ({selectedCoupon.discount_percent}%)</span>
                  <span className="text-emerald-400 font-semibold">
                    −{Math.ceil(confirmBuy.price * selectedCoupon.discount_percent / 100)} {CURRENCY_LABELS[confirmBuy.currency_type]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1.5 border-t border-white/5">
                  <span className="text-gray-400 font-semibold">Thực trả</span>
                  <span className="text-amber-200 font-bold text-base flex items-center gap-1.5">
                    {getCurrencyIcon(confirmBuy.currency_type)}
                    {Math.ceil(confirmBuy.price * (1 - selectedCoupon.discount_percent / 100))}
                    <span className="text-xs text-gray-500">{CURRENCY_LABELS[confirmBuy.currency_type]}</span>
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={executeBuyNow}
              disabled={buyingId === confirmBuy.id}
              className="w-full py-3 bg-[#670201] hover:bg-[#a00404] text-amber-100 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {buyingId === confirmBuy.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {buyingId === confirmBuy.id ? 'Đang xử lý...' : 'Mua Ngay'}
            </button>
            <button
              onClick={() => { if (!buyingId) setConfirmBuy(null); }}
              disabled={buyingId === confirmBuy.id}
              className="w-full mt-2 py-2.5 text-gray-500 hover:text-gray-300 text-sm transition-all disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Confirm Checkout */}
      <ConfirmDialog
        open={confirmCheckout}
        title="Xác Nhận Thanh Toán"
        message={`Bạn sắp thanh toán ${cart.length} vật phẩm trong giỏ hàng. Số dư sẽ bị trừ và không thể hoàn tác.`}
        confirmLabel="Thanh Toán"
        cancelLabel="Hủy"
        details={[
          { label: 'Số vật phẩm', value: String(cart.length) },
          ...(cartTotals.huaTien > 0 ? [{
            label: 'Hoa Tiền',
            value: couponDiscount > 0 && cartTotals.huaTien !== discountedTotals.huaTien
              ? `${cartTotals.huaTien} → ${discountedTotals.huaTien} (giảm ${cartTotals.huaTien - discountedTotals.huaTien})`
              : String(cartTotals.huaTien)
          }] : []),
          ...(cartTotals.congDuc > 0 ? [{
            label: 'Công Đức',
            value: couponDiscount > 0 && cartTotals.congDuc !== discountedTotals.congDuc
              ? `${cartTotals.congDuc} → ${discountedTotals.congDuc} (giảm ${cartTotals.congDuc - discountedTotals.congDuc})`
              : String(cartTotals.congDuc)
          }] : []),
          ...(cartTotals.amDuc > 0 ? [{
            label: 'Âm Đức',
            value: couponDiscount > 0 && cartTotals.amDuc !== discountedTotals.amDuc
              ? `${cartTotals.amDuc} → ${discountedTotals.amDuc} (giảm ${cartTotals.amDuc - discountedTotals.amDuc})`
              : String(cartTotals.amDuc)
          }] : []),
          ...(selectedCoupon ? [{ label: 'Phiếu áp dụng', value: `${selectedCoupon.code} — giảm ${selectedCoupon.discount_percent}%` }] : []),
        ]}
        onConfirm={executeCheckout}
        onCancel={() => setConfirmCheckout(false)}
      />

      {/* Purchase Success Screen */}
      {purchaseSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a0a0a] border border-[#670201]/40 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-amber-100/90 mb-2">Quý khách mua hàng thành công</h3>
            <p className="text-sm text-gray-400 mb-5">Vật phẩm đã được chuyển vào kho. Chúc quý khách tu hành thuận lợi!</p>

            {purchaseSuccess.itemNames.length > 0 && (
              <div className="mb-5 p-3 rounded-lg bg-black/30 border border-white/5">
                <p className="text-xs text-gray-500 mb-2">Vật phẩm đã mua ({purchaseSuccess.itemNames.length})</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {purchaseSuccess.itemNames.map((name, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-200/90 border border-amber-500/20">{name}</span>
                  ))}
                </div>
              </div>
            )}

            {(purchaseSuccess.totals.huaTien > 0 || purchaseSuccess.totals.congDuc > 0 || purchaseSuccess.totals.amDuc > 0) && (
              <div className="mb-5 p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5">
                <p className="text-xs text-gray-500 mb-1">Tổng chi phí</p>
                {purchaseSuccess.totals.huaTien > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Coins className="w-4 h-4 text-amber-400" /> Hoa Tiền</span>
                    <span className="text-amber-200 font-bold">{purchaseSuccess.totals.huaTien}</span>
                  </div>
                )}
                {purchaseSuccess.totals.congDuc > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-cyan-400" /> Công Đức</span>
                    <span className="text-cyan-200 font-bold">{purchaseSuccess.totals.congDuc}</span>
                  </div>
                )}
                {purchaseSuccess.totals.amDuc > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Skull className="w-4 h-4 text-amber-400" /> Âm Đức</span>
                    <span className="text-amber-200 font-bold">{purchaseSuccess.totals.amDuc}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setPurchaseSuccess(null)}
              className="w-full py-3 bg-[#670201] hover:bg-[#a00404] text-amber-100 font-bold rounded-lg transition-all"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
