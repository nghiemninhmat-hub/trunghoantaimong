import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  BookOpen, Sparkles, Flame, ChevronDown, Swords, TrendingUp,
  Eye, Zap, Scroll, AlertTriangle, Crown, Ghost, Target, Layers
} from 'lucide-react';

type LevelKey = 'LV1' | 'LV2' | 'LV3' | 'LV4';

const LEVEL_CONFIG: Record<LevelKey, {
  name: string;
  subtitle: string;
  icon: typeof Sparkles;
  accent: string;
  border: string;
  bg: string;
  glow: string;
  badge: string;
}> = {
  LV1: {
    name: 'Hiển Nghệ',
    subtitle: 'Thành thục nghiệp thuật cơ bản',
    icon: BookOpen,
    accent: 'text-gray-300',
    border: 'border-gray-500/40',
    bg: 'from-gray-900/40 to-gray-800/20',
    glow: 'shadow-gray-500/10',
    badge: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  },
  LV2: {
    name: 'Nhập Thần',
    subtitle: 'Nhuần nhuyễn, điêu luyện',
    icon: Sparkles,
    accent: 'text-cyan-300',
    border: 'border-cyan-500/40',
    bg: 'from-cyan-950/40 to-blue-900/20',
    glow: 'shadow-cyan-500/10',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  LV3: {
    name: 'Minh Lý',
    subtitle: 'Vận dụng nhuần nhuyễn bậc cao',
    icon: Flame,
    accent: 'text-amber-300',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/40 to-orange-900/20',
    glow: 'shadow-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  LV4: {
    name: 'Hóa Cảnh',
    subtitle: 'Vận dụng kỹ năng mạnh nhất',
    icon: Crown,
    accent: 'text-rose-300',
    border: 'border-rose-500/40',
    bg: 'from-rose-950/40 to-red-900/20',
    glow: 'shadow-rose-500/10',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
};

const GHOST_TYPES = [
  { name: 'Du hồn', icon: Ghost, color: 'text-blue-300' },
  { name: 'Oán hồn', icon: Ghost, color: 'text-cyan-300' },
  { name: 'Lệ quỷ', icon: Ghost, color: 'text-amber-300' },
  { name: 'Hung sát', icon: Swords, color: 'text-orange-300' },
];

function StatusReductionTable({ level }: { level: LevelKey }) {
  const data: Record<LevelKey, Array<{ status: string; reduction: string; limit: string; exclude: string }>> = {
    LV1: [],
    LV2: [
      { status: 'Tinh thần', reduction: 'Giảm 1 mức độ thẻ', limit: 'Tối đa 2 kỹ năng', exclude: 'Không áp dụng thẻ đỏ đậm trở lên' },
      { status: 'Thể chất', reduction: 'Giảm 1 mức độ thẻ', limit: 'Tối đa 2 kỹ năng', exclude: 'Không áp dụng thẻ đỏ đậm trở lên' },
      { status: 'Tâm linh', reduction: 'Giảm 1 mức độ thẻ', limit: 'Tối đa 1 kỹ năng', exclude: 'Không áp dụng thẻ đỏ đậm trở lên' },
    ],
    LV3: [
      { status: 'Tinh thần', reduction: 'Giảm 2 mức độ thẻ', limit: 'Tối đa 2 kỹ năng', exclude: 'Không áp dụng thẻ tím nhạt trở lên' },
      { status: 'Thể chất', reduction: 'Giảm 2 mức độ thẻ', limit: 'Tối đa 2 kỹ năng', exclude: 'Không áp dụng thẻ tím nhạt trở lên' },
      { status: 'Tâm linh', reduction: 'Giảm 1 mức độ thẻ', limit: 'Tối đa 2 kỹ năng', exclude: 'Không áp dụng thẻ đỏ đậm trở lên' },
    ],
    LV4: [
      { status: 'Tinh thần', reduction: 'Giảm 2 mức độ thẻ', limit: 'Tối đa 1 kỹ năng', exclude: 'Không áp dụng thẻ tím đậm trở lên' },
      { status: 'Thể chất', reduction: 'Giảm 2 mức độ thẻ', limit: 'Tối đa 1 kỹ năng', exclude: 'Không áp dụng thẻ tím đậm trở lên' },
      { status: 'Tâm linh', reduction: 'Giảm 1 mức độ thẻ', limit: 'Tối đa 1 kỹ năng', exclude: 'Không áp dụng thẻ tím đậm trở lên' },
    ],
  };

  const rows = data[level];
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#670201]/15">
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Trạng thái</th>
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Mức giảm</th>
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Giới hạn</th>
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Ngoại lệ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-[#670201]/[0.06] transition-colors">
                <td className="px-3 py-2.5 font-semibold text-amber-200/80 whitespace-nowrap">{row.status}</td>
                <td className="px-3 py-2.5 text-gray-400">{row.reduction}</td>
                <td className="px-3 py-2.5 text-gray-400">{row.limit}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs italic">{row.exclude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DamageTable({ level }: { level: LevelKey }) {
  const data: Record<LevelKey, Array<{ ghost: string; damage: string; control: string; maxSkills: string }>> = {
    LV1: [],
    LV2: [
      { ghost: 'Du hồn', damage: '+10%', control: '+5%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Oán hồn', damage: '+10%', control: '+5%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Lệ quỷ', damage: '+10%', control: '+5%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Hung sát', damage: '+5%', control: '+5%', maxSkills: 'Tối đa 1 kỹ năng' },
    ],
    LV3: [
      { ghost: 'Du hồn', damage: '+10%', control: '+15%', maxSkills: 'Tối đa 2 kỹ năng' },
      { ghost: 'Oán hồn', damage: '+10%', control: '+15%', maxSkills: 'Tối đa 2 kỹ năng' },
      { ghost: 'Lệ quỷ', damage: '+10%', control: '+15%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Hung sát', damage: '+5%', control: '+5%', maxSkills: 'Tối đa 1 kỹ năng' },
    ],
    LV4: [
      { ghost: 'Du hồn', damage: '+20%', control: '+15%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Oán hồn', damage: '+20%', control: '+15%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Lệ quỷ', damage: '+15%', control: '+15%', maxSkills: 'Tối đa 1 kỹ năng' },
      { ghost: 'Hung sát', damage: '+5%', control: '+5%', maxSkills: 'Tối đa 1 kỹ năng' },
    ],
  };

  const rows = data[level];
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#670201]/15">
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Quỷ dị</th>
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Sát thương</th>
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Khống chế</th>
              <th className="px-3 py-2.5 text-left font-semibold text-amber-300/80 border-b border-[#670201]/30">Giới hạn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-[#670201]/[0.06] transition-colors">
                <td className="px-3 py-2.5 font-semibold text-amber-200/80 whitespace-nowrap">{row.ghost}</td>
                <td className="px-3 py-2.5 text-emerald-300/80 font-medium">{row.damage}</td>
                <td className="px-3 py-2.5 text-cyan-300/80 font-medium">{row.control}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{row.maxSkills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LevelCard({ levelKey }: { levelKey: LevelKey }) {
  const [expanded, setExpanded] = useState(levelKey === 'LV1');
  const config = LEVEL_CONFIG[levelKey];
  const Icon = config.icon;
  const levelNum = levelKey.replace('LV', '');

  const descriptions: Record<LevelKey, string> = {
    LV1: 'Người chơi có khả năng sử dụng thành thụ nghiệp thuật cơ bản. Đối với loại kỹ thuật yêu cầu kỹ năng phức tạp, ở mức độ cao hơn thì gặp hạn chế, không thể phát huy toàn bộ, tiêu hao lớn, dễ gặp tình huống phản phệ nghiêm trọng.',
    LV2: 'Người chơi có khả năng nhuần nhuyễn, điêu luyện kỹ năng cơ bản, vận dụng thành thục các kỹ năng ở bậc khó cao hơn, khả năng phát huy tăng. Tuy nhiên đối với các kỹ năng truyền thừa, mật truyền phức tạp vẫn gặp phải tiêu hao cao, giảm mức độ phản phệ hoặc tăng thời lượng phục hồi so với cấp trước.',
    LV3: 'Người chơi vận dụng nhuần nhuyễn các kỹ năng ở mức cao, có thể phát huy trọn vẹn sát thương/khả năng chiêu thức ở trạng thái tốt nhất, giảm mức tiêu hao và phản phệ cũng như tăng thời lượng phục hồi. Tuy nhiên đối với những kỹ năng có mức độ phức tạp, sát thương cao, diện rộng, khả năng phát huy vẫn hạn chế. Tùy kỹ năng sẽ giảm mức phản phệ hoặc không.',
    LV4: 'Người chơi vận dụng nhuần nhuyễn các kỹ năng mạnh nhất của mình, có thể phát huy trọn vẹn 80-100% sát thương/khả năng chiêu thức ở trạng thái tốt nhất, giảm mức tiêu hao và phản phệ cũng như tăng thời lượng phục hồi. Tùy kỹ năng sẽ giảm mức phản phệ hoặc không.',
  };

  const systemNotes: Record<LevelKey, string> = {
    LV1: 'Người chơi được ghi nhận kỹ năng và phát huy như đã đăng ký với Hệ thống, thông qua QTV phê duyệt thành công. Lưu ý, mức đăng ký là mức tối đa, tùy trạng thái hiệu quả sát thương/khống chế có thể dao động.',
    LV2: 'Người chơi có khả năng giảm mức ảnh hưởng đến trạng thái tinh thần, thể chất và tâm linh. Đồng thời tăng khả năng sát thương, khống chế đối với Quỷ dị.',
    LV3: 'Người chơi có khả năng giảm mức ảnh hưởng đến trạng thái tinh thần, thể chất và tâm linh. Đồng thời tăng khả năng sát thương, khống chế đối với Quỷ dị.',
    LV4: 'Người chơi có khả năng giảm mức ảnh hưởng đến trạng thái tinh thần, thể chất và tâm linh. Đồng thời tăng khả năng sát thương, khống chế đối với Quỷ dị.',
  };

  return (
    <article className={`relative overflow-hidden rounded-2xl border ${config.border} bg-gradient-to-b ${config.bg} shadow-lg ${config.glow} transition-all duration-300`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 sm:p-6 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-black/40 border ${config.border} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${config.accent}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${config.badge}`}>LV{levelNum}</span>
              <h4 className={`text-lg sm:text-xl font-serif font-bold ${config.accent}`}>{config.name}</h4>
            </div>
            <p className="text-xs text-gray-500">{config.subtitle}</p>
          </div>
          <ChevronDown className={`flex-shrink-0 w-5 h-5 ${config.accent} opacity-60 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-6 sm:px-6 border-t border-white/10 pt-5 space-y-4">
          <p className="text-sm text-gray-400 leading-relaxed">{descriptions[levelKey]}</p>

          <div className="rounded-xl border border-[#670201]/25 bg-[#1a0a08]/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scroll className="w-3.5 h-3.5 text-amber-300/60" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/60">Về nghiệp thuật đăng ký ở Hệ thống</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{systemNotes[levelKey]}</p>
          </div>

          {levelKey !== 'LV1' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-300/70" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-300/70">Trạng thái</span>
                </div>
                <StatusReductionTable level={levelKey} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-3.5 h-3.5 text-red-300/70" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-300/70">Sát thương / Khống chế</span>
                </div>
                <DamageTable level={levelKey} />
              </div>
            </>
          )}

          <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3">
            <p className="text-xs text-amber-200/50 italic leading-relaxed">
              Lưu ý: Mức đã tăng sau đăng ký ở cấp độ này là mức tối đa, tùy trạng thái hiệu quả sát thương/khống chế có thể dao động.
              Các mức giảm độ ảnh hưởng có thể được áp dụng đối với nhiều kỹ năng khác nhau, không nhất thiết chỉ dồn vào 1 kỹ năng.
              Tuy nhiên, không thể cộng dồn để giảm cùng lúc nhiều mức độ trạng thái hoặc sát thương trên cùng một kỹ năng.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

export default function NghiepThuatPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Link to="/world" className="hover:text-amber-300/70 transition-colors">Bách Khoa Toàn Thư</Link>
        <span>/</span>
        <span className="text-amber-300/50">Nhân Vật</span>
        <span>/</span>
        <span className="text-amber-300/80">Nghiệp Thuật</span>
      </div>

      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Nhân Vật · Kỹ Nghệ</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100/90">Nghiệp Thuật</h2>
        <p className="text-sm text-gray-500 mt-2 italic max-w-2xl mx-auto">
          Kỹ thuật chuyên môn của các nghề nghiệp tại Trùng Hoan Tái — từ lập trận họa phù của Đạo sĩ đến chọn gỗ đóng đinh của trại hòm.
        </p>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Cấp Độ" value={4} icon={Layers} accent="gold" />
        <StatCard label="Loại Quỷ Dị" value={4} icon={Ghost} accent="vermilion" />
        <StatCard label="Trạng Thái" value={3} icon={AlertTriangle} accent="jade" hint="Tinh thần · Thể chất · Tâm linh" />
        <StatCard label="Thăng Cấp" value="Diệt quỷ" icon={TrendingUp} accent="gold" hint="Trong Dị sự" />
      </StatGrid>

      {/* Section: Nghiệp Thuật */}
      <section className="space-y-3">
        <div className="sticky top-20 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#170707]/95 border border-[#670201]/30 backdrop-blur-md">
          <BookOpen className="w-4 h-4 text-amber-300/70" />
          <h3 className="text-sm font-serif font-bold tracking-wide uppercase text-amber-300/70">Nghiệp Thuật</h3>
        </div>
        <div className="rounded-2xl border border-[#670201]/20 bg-gradient-to-b from-[#0d0606] to-[#0a0404] p-5 sm:p-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            Nghiệp thuật ý chỉ đến kỹ thuật, khả năng chuyên môn nói chung của nhiều loại nghề nghiệp khác nhau tại Trùng Hoan Tái.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mt-2">
            Ví dụ: Nghiệp thuật của Đạo sĩ là kỹ thuật lập trận họa phù. Nghiệp thuật của trại hòm là kỹ thuật chọn gỗ, đóng đinh,...
          </p>
        </div>
      </section>

      {/* Section: Mức Độ Nghiệp Thuật */}
      <section className="space-y-3">
        <div className="sticky top-20 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#170707]/95 border border-[#670201]/30 backdrop-blur-md">
          <TrendingUp className="w-4 h-4 text-amber-300/70" />
          <h3 className="text-sm font-serif font-bold tracking-wide uppercase text-amber-300/70">Mức Độ Nghiệp Thuật</h3>
        </div>
        <div className="rounded-2xl border border-[#670201]/20 bg-gradient-to-b from-[#0d0606] to-[#0a0404] p-5 sm:p-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            Mức độ nghiệp thuật ý chỉ đến mức độ thuần thục, khả năng sử dụng tuyệt kỹ lão luyện ra sao.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mt-2">
            Tuy mức độ này đối với mỗi ngành nghề có thể có cách gọi khác nhau. Ví như mức độ nghiệp thuật của Đạo sĩ gọi là đạo hạnh, tu vi. Đối với y sĩ có thể gọi là tài học... Dẫu vậy tựu chung vẫn gọi là mức độ nghiệp thuật.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mt-2">
            Tại Trùng Hoan Tái, mức độ nghiệp thuật bao gồm 4 cấp:
          </p>
        </div>

        {/* Level Cards */}
        <div className="space-y-4">
          {(['LV1', 'LV2', 'LV3', 'LV4'] as LevelKey[]).map(key => (
            <LevelCard key={key} levelKey={key} />
          ))}
        </div>
      </section>

      {/* Section: Ý Nghĩa */}
      <section className="space-y-3">
        <div className="sticky top-20 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#170707]/95 border border-[#670201]/30 backdrop-blur-md">
          <Eye className="w-4 h-4 text-amber-300/70" />
          <h3 className="text-sm font-serif font-bold tracking-wide uppercase text-amber-300/70">Ý Nghĩa</h3>
        </div>
        <div className="rounded-2xl border border-[#670201]/20 bg-gradient-to-b from-[#0d0606] to-[#0a0404] p-5 sm:p-6 space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed">
            Mức độ nghiệp thuật chỉ là mức đánh giá sơ bộ, là yếu tố gia giảm các phản phệ/sát thương của người chơi khi dùng kỹ năng của mình và tác động lên quỷ. Nghiệp thuật phát huy tùy vào tình huống thực tế của Dị sự, trạng thái của người chơi và quyết định của hệ thống.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Mức độ nghiệp thuật ở Trùng Hoan Tái được xét là ngang nhau đối với người cùng chung ngành nghề nhằm kiểm soát mạch diễn thích hợp, không thể so sánh mức độ nghiệp thuật của ngành này và ngành khác để xét ai mạnh hơn ai trong PK.
          </p>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
            <p className="text-sm text-amber-200/70 leading-relaxed">
              Đạo sĩ cấp độ Nhập thần có thể áp chế Đạo sĩ cấp độ Hiển nghệ, có phần thắng cao hơn trong việc truy sát. Tuy nhiên nếu khác ngành nghề, hệ thống sẽ tiến hành xét tình huống, tính logic, nghiệp thuật và cả mức độ nghiệp thuật để đưa ra kết luận cuối cùng.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Cơ Chế Thăng Cấp */}
      <section className="space-y-3">
        <div className="sticky top-20 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#170707]/95 border border-[#670201]/30 backdrop-blur-md">
          <TrendingUp className="w-4 h-4 text-amber-300/70" />
          <h3 className="text-sm font-serif font-bold tracking-wide uppercase text-amber-300/70">Cơ Chế Thăng Cấp</h3>
        </div>
        <div className="rounded-2xl border border-[#670201]/20 bg-gradient-to-b from-[#0d0606] to-[#0a0404] p-5 sm:p-6 space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed">
            Người chơi có thể thăng cấp bằng cách tham gia Diệt quỷ dị trong Dị sự, xét vào mức độ tham gia để tính thăng cấp (sau Dị sự). Mỗi lần tổ đội diệt quỷ dị thành công ở Dị sự, người tham gia được xét tăng 1 cấp.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Đồng thời, việc thăng cấp có thể dựa vào các nhiệm vụ phụ nguy hiểm, đối đầu với quỷ. Người chơi có biểu hiện nổi trội sẽ được hệ thống xét thăng cấp ngay trong Dị sự.
          </p>
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400/70" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400/70">Lưu ý</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tùy vào mức độ thương thế, phản phệ, mức độ nghiệp thuật cũng có thể giảm trong số ít cmt. Hệ thống sẽ xem xét và quyết định việc này trong Dị sự thực tế.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Cập Nhật Thanh Tiến Độ Tiêu Diệt Quỷ */}
      <section className="space-y-3">
        <div className="sticky top-20 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#170707]/95 border border-[#670201]/30 backdrop-blur-md">
          <Target className="w-4 h-4 text-amber-300/70" />
          <h3 className="text-sm font-serif font-bold tracking-wide uppercase text-amber-300/70">Cập Nhật Thanh Tiến Độ Tiêu Diệt Quỷ</h3>
        </div>
        <div className="rounded-2xl border border-[#670201]/20 bg-gradient-to-b from-[#0d0606] to-[#0a0404] p-5 sm:p-6 space-y-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Sau đợt cập nhật này, kỹ năng của người chơi sẽ được quy định khoảng sát thương rõ ràng với quỷ dị. Phần sát thương này cũng sẽ được quy đổi sang điểm cống hiến, kết quả do Quản lý Dị sự xem xét, dựa vào quy chế sau:
          </p>

          {/* Solo - no combo */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-serif font-bold text-amber-200/80">Đơn lẻ — Không kết nối tiếp</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Người chơi đơn lẻ tự tạo sát thương, không có tác dụng kết nối tiếp tạo sơ hở cho người chơi khác cùng tấn công:
            </p>
            <p className="text-sm text-emerald-300/80 font-medium mt-1.5">
              Tối đa 5 điểm cống hiến / lượt thi triển kỹ năng.
            </p>
          </div>

          {/* Solo - with combo */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-cyan-300/70" />
              <span className="text-sm font-serif font-bold text-cyan-200/80">Đơn lẻ — Có kết nối tiếp</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Người chơi đơn lẻ tự tạo sát thương, thành công nối tiếp tạo sơ hở cho người chơi khác cùng tấn công:
            </p>
            <p className="text-sm text-emerald-300/80 font-medium mt-1.5">
              Tối đa 5 điểm cống hiến cá nhân + 3 điểm cống hiến khi có người chơi ngay sau tương tác [chỉ tính 1 lượt].
            </p>
          </div>

          {/* Team combo */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-amber-300/70" />
              <span className="text-sm font-serif font-bold text-amber-200/80">Kết hợp — Đồng lòng</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Người chơi kết hợp cùng tạo lực sát thương lớn, nhận thấy có tinh thần hợp tác, đồng lòng: Mỗi người được cộng tối đa 5 điểm cống hiến cá nhân. Điểm cống hiến tổ đội được tính theo công thức sau cho mỗi người:
            </p>
            <div className="mt-3 rounded-lg border border-amber-500/15 bg-black/40 p-3 text-center">
              <p className="text-sm font-mono text-amber-200/70">
                [Tổng sát thương thi triển (%)] / (số lượng người chơi cùng hợp tác) + Tổng số lượt thi triển / 2
              </p>
            </div>
            <p className="text-xs text-gray-500 italic mt-2">
              Lưu ý: Sát thương đồng lòng thi triển luôn cao hơn tổng số sát thương cá nhân riêng lẻ liên tục mà không có tính kết nối.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#670201]/10 border border-[#670201]/20">
          <Zap className="w-3.5 h-3.5 text-amber-400/60" />
          <span className="text-xs text-gray-500 italic">Nghiệp thuật phát huy tùy vào tình huống thực tế và quyết định của Hệ thống</span>
        </div>
      </div>
    </div>
  );
}
