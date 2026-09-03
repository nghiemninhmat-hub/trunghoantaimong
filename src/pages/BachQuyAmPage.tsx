import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, BachQuyAm } from '@/lib/supabase';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  Ghost, BookOpen, Skull, Search, ChevronDown,
  AlertTriangle, Flame, Sparkles, Scroll, Eye, Quote, Target, ScrollText, Layers, Zap
} from 'lucide-react';

const DANGER_COLORS: Record<string, string> = {
  'Du Hồn': 'text-blue-300/80',
  'Oán Hồn': 'text-cyan-300/80',
  'Lệ Quỷ': 'text-amber-300/80',
  'Hung Sát': 'text-orange-300/80',
  'Quỷ Tướng': 'text-red-300/80',
  'Quỷ Vương': 'text-rose-400/90',
};

function getDangerColor(level: string): string {
  for (const [key, color] of Object.entries(DANGER_COLORS)) {
    if (level.includes(key)) return color;
  }
  return 'text-amber-300/80';
}

const VOLUME_LABELS: Record<number, string> = {
  1: 'Quyển Nhất', 2: 'Quyển Nhị', 3: 'Quyển Tam', 4: 'Quyển Tứ', 5: 'Quyển Ngũ',
  6: 'Quyển Lục', 7: 'Quyển Thất', 8: 'Quyển Bát', 9: 'Quyển Cửu', 10: 'Quyển Thập',
  11: 'Quyển Thập Nhất', 12: 'Quyển Thập Nhị', 13: 'Quyển Thập Tam', 14: 'Quyển Thập Tứ', 15: 'Quyển Thất Ngũ',
};

export default function BachQuyAmPage() {
  const [ghosts, setGhosts] = useState<BachQuyAm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchGhosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('bach_quy_am')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      console.error('Lỗi tải Bách Quỷ Âm:', error.message);
    } else if (data) {
      setGhosts(data as BachQuyAm[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGhosts();
  }, [fetchGhosts]);

  const filteredGhosts = ghosts.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.looi_phan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.duyen_sinh.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.di_van.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group ghosts by volume_number
  const volumeGroups = useMemo(() => {
    const groups: Record<number, BachQuyAm[]> = {};
    for (const g of filteredGhosts) {
      if (!groups[g.volume_number]) groups[g.volume_number] = [];
      groups[g.volume_number].push(g);
    }
    return groups;
  }, [filteredGhosts]);

  const volumeNumbers = useMemo(() => Object.keys(volumeGroups).map(Number).sort((a, b) => a - b), [volumeGroups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <Ghost className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Cổ Tịch Quỷ Lục</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100/90">Bách Quỷ Âm</h2>
        <p className="text-sm text-gray-500 mt-2 italic max-w-2xl mx-auto">
          Cổ tịch do Trùng Hoan Tái biên soạn, ghi chép những quỷ dị từng được nhân gian phát hiện.
          Toàn bộ chia thành 15 dòng quỷ chính, mỗi dòng chia 5 Ngũ Chi — tổng cộng 75 loài quỷ.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Skull className="w-3.5 h-3.5" />
            <span>{ghosts.length} loài quỷ</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-amber-300/70">
            <Layers className="w-3.5 h-3.5" />
            <span>15 quyển</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Zap className="w-3.5 h-3.5" />
            <span>Phá pháp: Chưa cập nhật</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Stats overview */}
      <StatGrid cols={4}>
        <StatCard label="Tổng Số Quỷ" value={ghosts.length} icon={Ghost} accent="gold" />
        <StatCard label="Quyển Chính" value={15} icon={Scroll} accent="jade" />
        <StatCard label="Ngũ Chi / Quyển" value={5} icon={Layers} accent="vermilion" />
        <StatCard label="Kết Quả" value={filteredGhosts.length} icon={Search} accent={filteredGhosts.length < ghosts.length ? 'gold' : 'neutral'} hint={filteredGhosts.length < ghosts.length ? 'Đang lọc' : 'Tất cả'} />
      </StatGrid>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, lời phán, duyên sinh, dị văn..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
        />
      </div>

      {/* Danger progression legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/20 border border-white/5">
        <span className="text-xs text-gray-600 uppercase tracking-wider">Mức độ nguy hiểm:</span>
        {['Du Hồn', 'Oán Hồn', 'Lệ Quỷ', 'Hung Sát', 'Quỷ Tướng', 'Quỷ Vương'].map((level, i) => (
          <div key={level} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-700 text-xs">→</span>}
            <span className={`text-xs font-semibold ${getDangerColor(level)}`}>{level}</span>
          </div>
        ))}
      </div>

      {/* Ghost entries grouped by volume */}
      <div className="space-y-8">
        {volumeNumbers.map(volNum => {
          const volGhosts = volumeGroups[volNum];
          const firstGhost = volGhosts[0];
          if (!firstGhost) return null;

          return (
            <section key={volNum} className="space-y-4">
              {/* Volume header */}
              <div className="relative overflow-hidden rounded-2xl border border-[#670201]/25 bg-gradient-to-b from-[#120808] to-[#0a0505] p-5 sm:p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#670201]/20 border border-[#670201]/30 flex items-center justify-center">
                    <Scroll className="w-5 h-5 text-amber-300/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-amber-300/50 uppercase tracking-widest font-serif">{VOLUME_LABELS[volNum] ?? `Quyển ${volNum}`}</div>
                    <h3 className="text-lg sm:text-2xl font-serif font-bold text-amber-100/90 leading-tight">
                      {firstGhost.volume_name}
                    </h3>
                  </div>
                </div>
                {firstGhost.volume_subtitle && (
                  <div className="text-base sm:text-lg font-serif text-amber-200/70 mb-2">
                    {firstGhost.volume_subtitle}
                  </div>
                )}
                {firstGhost.volume_tagline && (
                  <p className="text-sm text-gray-400 italic mb-4 leading-relaxed">
                    "{firstGhost.volume_tagline}"
                  </p>
                )}

                {/* Volume-level details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {firstGhost.volume_traits && (
                    <VolumeInfoBlock icon={Ghost} label="Đặc tính chung" value={firstGhost.volume_traits} />
                  )}
                  {firstGhost.volume_signs && (
                    <VolumeInfoBlock icon={Eye} label="Dấu hiệu xuất hiện" value={firstGhost.volume_signs} />
                  )}
                  {firstGhost.volume_taboo && (
                    <VolumeInfoBlock icon={AlertTriangle} label="Quỷ Kỵ" value={firstGhost.volume_taboo} accent="text-orange-300/70" />
                  )}
                  {firstGhost.volume_vuc_name && (
                    <VolumeInfoBlock icon={Skull} label={`Quỷ Vực · ${firstGhost.volume_vuc_name}`} value={firstGhost.volume_vuc_desc} accent="text-red-300/60" />
                  )}
                </div>
              </div>

              {/* Ghost entries in this volume */}
              <div className="space-y-3">
                {volGhosts.map(ghost => {
                  const isExpanded = expandedId === ghost.id;

                  return (
                    <article
                      key={ghost.id}
                      className="relative overflow-hidden rounded-2xl border border-[#670201]/20 bg-gradient-to-b from-[#0d0606] to-[#0a0404] shadow-lg shadow-black/10 transition-all duration-300"
                    >
                      {/* Header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ghost.id)}
                        className="w-full p-4 sm:p-5 text-left transition-colors hover:bg-[#670201]/[0.04]"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-[#670201]/20 border border-[#670201]/30">
                            <Ghost className="w-5 h-5 text-amber-300/80" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-amber-300/40 font-mono flex-shrink-0">
                                {String(ghost.display_order).padStart(2, '0')}
                              </span>
                              <h4 className="text-base sm:text-lg font-serif font-bold text-amber-100/90 leading-tight">
                                {ghost.name}
                              </h4>
                            </div>
                            {ghost.brief_description && (
                              <p className="text-xs text-gray-500 mb-2">{ghost.brief_description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pr-8">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/5 text-xs font-medium ${getDangerColor(ghost.danger_level)}`}>
                                <AlertTriangle className="w-3 h-3" />
                                {ghost.danger_level}
                              </span>
                              {ghost.event_level && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/5 text-xs text-gray-500">
                                  <Flame className="w-3 h-3" />
                                  Dị sự: {ghost.event_level}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-10 sm:h-11">
                            <ChevronDown className={`w-5 h-5 text-amber-300/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-5 pb-6 sm:px-6 border-t border-[#670201]/15 pt-5">
                          <div className="space-y-3">
                            {ghost.looi_phan && (
                              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1a0a0a] to-[#0d0606] border border-[#670201]/20">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Quote className="w-3.5 h-3.5 text-amber-300/60" />
                                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/60">Lời phán</span>
                                </div>
                                <p className="text-sm text-amber-100/80 italic leading-relaxed font-serif">"{ghost.looi_phan}"</p>
                              </div>
                            )}
                            {ghost.duyen_sinh && (
                              <DetailField icon={BookOpen} label="Duyên sinh" value={ghost.duyen_sinh} />
                            )}
                            {ghost.quy_tinh && (
                              <DetailField icon={Ghost} label="Quỷ tính" value={ghost.quy_tinh} />
                            )}
                            {ghost.quy_luat && (
                              <DetailField icon={AlertTriangle} label="Quỷ luật" value={ghost.quy_luat} accent="text-orange-300/70" />
                            )}
                            {ghost.quy_vuc && (
                              <DetailField icon={Skull} label="Quỷ Vực" value={ghost.quy_vuc} accent="text-red-300/70" />
                            )}
                            {ghost.tu_huyet && (
                              <DetailField icon={Target} label="Tử huyệt" value={ghost.tu_huyet} accent="text-cyan-300/70" />
                            )}
                            {/* Phá pháp — always "Chưa cập nhật" */}
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
                              <div className="flex items-center gap-2 sm:min-w-[180px] flex-shrink-0">
                                <Zap className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phá pháp</span>
                              </div>
                              <p className="text-sm leading-relaxed text-gray-600 italic">{ghost.pha_phap || 'Chưa cập nhật'}</p>
                            </div>
                            {ghost.di_van && (
                              <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <ScrollText className="w-3.5 h-3.5 text-amber-300/50" />
                                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/50">Dị văn</span>
                                </div>
                                <p className="text-sm text-gray-400 italic leading-relaxed">"{ghost.di_van}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filteredGhosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Ghost className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Không tìm thấy loài quỷ nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VolumeInfoBlock({
  icon: Icon,
  label,
  value,
  accent = 'text-gray-400',
}: {
  icon: typeof Ghost;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-black/20 border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-amber-300/50" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/50">{label}</span>
      </div>
      <p className={`text-xs leading-relaxed ${accent}`}>{value}</p>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  accent = 'text-gray-300',
}: {
  icon: typeof Ghost;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
      <div className="flex items-center gap-2 sm:min-w-[180px] flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-amber-300/50" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/50">{label}</span>
      </div>
      <p className={`text-sm leading-relaxed ${accent}`}>{value}</p>
    </div>
  );
}
